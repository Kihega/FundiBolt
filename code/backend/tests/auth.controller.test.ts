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

jest.mock("../src/config/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(async ({ where }: any) => {
        const email = where.email ?? where.OR?.find((w: any) => w.email)?.email;
        return email && usersByEmail.has(email) ? usersByEmail.get(email) : null;
      }),
      create: jest.fn(),
    },
  },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));

import { app } from "../src/app";

describe("POST /api/auth/signup - stages a pending signup instead of creating a user", () => {
  beforeEach(() => {
    redisStore.clear();
    usersByEmail.clear();
  });

  it("does not create a user row - it stores pending signup data and issues an OTP", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      fullName: "Jane Doe",
      email: "jane@test.com",
      password: "correcthorse",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user).toBeUndefined();

    expect(redisStore.has("pending-signup:jane@test.com")).toBe(true);
    expect(redisStore.has("otp:jane@test.com")).toBe(true);
  });

  it("defaults to customer role in the stored pending signup when none is provided", async () => {
    await request(app).post("/api/auth/signup").send({
      fullName: "Jane Doe",
      email: "jane2@test.com",
      password: "correcthorse",
    });
    const pending = JSON.parse(redisStore.get("pending-signup:jane2@test.com")!);
    expect(pending.role).toBe("customer");
  });

  it("accepts fundi as a self-selected role", async () => {
    await request(app).post("/api/auth/signup").send({
      fullName: "Joe Fundi",
      email: "joe@test.com",
      password: "correcthorse",
      role: "fundi",
    });
    const pending = JSON.parse(redisStore.get("pending-signup:joe@test.com")!);
    expect(pending.role).toBe("fundi");
  });

  // Security regression test: role is client-supplied input. Even if a
  // request explicitly asks for "admin", it must never be honored - only
  // "customer" and "fundi" are self-selectable at signup.
  it("never stores admin via signup, even if explicitly requested", async () => {
    await request(app).post("/api/auth/signup").send({
      fullName: "Sneaky Admin",
      email: "sneaky@test.com",
      password: "correcthorse",
      role: "admin",
    });
    const pending = JSON.parse(redisStore.get("pending-signup:sneaky@test.com")!);
    expect(pending.role).toBe("customer");
  });

  it("rejects signup if a verified account already exists for that email", async () => {
    usersByEmail.set("existing@test.com", { id: "1", email: "existing@test.com" });
    const res = await request(app).post("/api/auth/signup").send({
      fullName: "Duplicate",
      email: "existing@test.com",
      password: "correcthorse",
    });
    expect(res.status).toBe(409);
  });

  it("never stores the plaintext password", async () => {
    await request(app).post("/api/auth/signup").send({
      fullName: "Safe User",
      email: "safe@test.com",
      password: "correcthorse-battery-staple",
    });
    const pending = JSON.parse(redisStore.get("pending-signup:safe@test.com")!);
    expect(pending.passwordHash).toBeDefined();
    expect(pending.passwordHash).not.toBe("correcthorse-battery-staple");
  });
});
