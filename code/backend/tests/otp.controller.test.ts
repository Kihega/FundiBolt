import request from "supertest";

const redisStore = new Map<string, string>();

jest.mock("../src/config/redis", () => ({
  redis: {
    get: jest.fn((key: string) => Promise.resolve(redisStore.get(key) ?? null)),
    set: jest.fn((key: string, value: string) => {
      redisStore.set(key, value);
      return Promise.resolve("OK");
    }),
    del: jest.fn((key: string) => {
      redisStore.delete(key);
      return Promise.resolve(1);
    }),
    expire: jest.fn(() => Promise.resolve(1)),
  },
  checkRedisConnection: jest.fn().mockResolvedValue(true),
}));

const usersByEmail = new Map<string, any>();
let idCounter = 1;

jest.mock("../src/config/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(async ({ where }: any) => {
        const email = where.email ?? where.OR?.find((w: any) => w.email)?.email;
        return email && usersByEmail.has(email) ? usersByEmail.get(email) : null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const user = { id: String(idCounter++), ...data, createdAt: new Date() };
        usersByEmail.set(data.email, user);
        return user;
      }),
    },
  },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));

import { app } from "../src/app";

function pendingSignupPayload(email: string) {
  return JSON.stringify({
    fullName: "Test User",
    email,
    phone: null,
    passwordHash: "hashed-password",
    role: "customer",
  });
}

describe("POST /api/otp/verify", () => {
  beforeEach(() => {
    redisStore.clear();
    usersByEmail.clear();
    idCounter = 1;
  });

  it("requires email and code", async () => {
    const res = await request(app).post("/api/otp/verify").send({});
    expect(res.status).toBe(400);
  });

  it("rejects an invalid code when nothing is pending or stored", async () => {
    const res = await request(app).post("/api/otp/verify").send({ email: "nobody@test.com", code: "000000" });
    expect(res.status).toBe(400);
  });

  // The dev-bypass code alone isn't enough to create an account - there
  // must be an actual pending signup (i.e. someone actually called
  // /api/auth/signup) for it to turn into a user.
  it("rejects the dev-bypass code if there's no pending signup for that email", async () => {
    const res = await request(app).post("/api/otp/verify").send({ email: "ghost@test.com", code: "123456" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired|sign up again/i);
    expect(usersByEmail.has("ghost@test.com")).toBe(false);
  });

  it("creates the user only after a correct code + a valid pending signup", async () => {
    redisStore.set("otp:real@test.com", "482913");
    redisStore.set("pending-signup:real@test.com", pendingSignupPayload("real@test.com"));

    const res = await request(app).post("/api/otp/verify").send({ email: "real@test.com", code: "482913" });
    expect(res.status).toBe(200);
    expect(usersByEmail.has("real@test.com")).toBe(true);

    // Both Redis entries are cleaned up once the account is created.
    expect(redisStore.has("otp:real@test.com")).toBe(false);
    expect(redisStore.has("pending-signup:real@test.com")).toBe(false);
  });

  // Dev/test convenience (NEVER active in production - see the NODE_ENV
  // describe block below): a pending signup DOES exist here, so the
  // bypass code is enough to finish registration without a real inbox.
  it("accepts the dev-bypass code when a pending signup exists", async () => {
    redisStore.set("pending-signup:devtest@test.com", pendingSignupPayload("devtest@test.com"));
    // Deliberately no real OTP stored for this email.

    const res = await request(app).post("/api/otp/verify").send({ email: "devtest@test.com", code: "123456" });
    expect(res.status).toBe(200);
    expect(usersByEmail.has("devtest@test.com")).toBe(true);
  });

  it("is idempotent - verifying again after the account already exists still returns 200", async () => {
    usersByEmail.set("already@test.com", { id: "existing-id", email: "already@test.com" });
    const res = await request(app).post("/api/otp/verify").send({ email: "already@test.com", code: "123456" });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/otp/send", () => {
  beforeEach(() => {
    redisStore.clear();
  });

  it("requires an email", async () => {
    const res = await request(app).post("/api/otp/send").send({});
    expect(res.status).toBe(400);
  });

  it("refuses to send a code when there's no pending signup", async () => {
    const res = await request(app).post("/api/otp/send").send({ email: "nobody@test.com" });
    expect(res.status).toBe(400);
  });

  it("enforces the resend cooldown", async () => {
    redisStore.set("pending-signup:cooldown@test.com", pendingSignupPayload("cooldown@test.com"));

    const first = await request(app).post("/api/otp/send").send({ email: "cooldown@test.com" });
    expect(first.status).toBe(200);

    const second = await request(app).post("/api/otp/send").send({ email: "cooldown@test.com" });
    expect(second.status).toBe(429);
  });
});

// Directly unit-tests the safety guard at its source, rather than trying to
// flip NODE_ENV around a full HTTP request cycle.
describe("DEV_BYPASS_CODE respects NODE_ENV", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  it("is disabled when NODE_ENV=production", () => {
    jest.resetModules();
    process.env.NODE_ENV = "production";
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const otpService = require("../src/services/otpService");
    expect(otpService.DEV_BYPASS_CODE).toBeNull();
  });

  it("is enabled outside production", () => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const otpService = require("../src/services/otpService");
    expect(otpService.DEV_BYPASS_CODE).toBe("123456");
  });
});
