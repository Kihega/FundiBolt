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
  },
  checkRedisConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/config/prisma", () => ({
  prisma: {
    user: {
      update: jest.fn().mockResolvedValue({}),
    },
  },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));

import { app } from "../src/app";

describe("POST /api/otp/verify", () => {
  beforeEach(() => {
    redisStore.clear();
  });

  it("requires email and code", async () => {
    const res = await request(app).post("/api/otp/verify").send({});
    expect(res.status).toBe(400);
  });

  it("rejects an invalid code", async () => {
    const res = await request(app).post("/api/otp/verify").send({ email: "a@test.com", code: "000000" });
    expect(res.status).toBe(400);
  });

  // Regression test: the hardcoded "123456" dev-bypass has been removed.
  // No OTP was ever generated/stored for this email, so 123456 must NOT
  // be accepted just because it used to be the hardcoded bypass value.
  // If this test ever fails, a backdoor has been reintroduced.
  it("rejects the old dev-bypass code (123456) - it must never work again", async () => {
    const res = await request(app).post("/api/otp/verify").send({ email: "backdoor-check@test.com", code: "123456" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it("accepts the correct code that was actually issued", async () => {
    redisStore.set("otp:real@test.com", "482913");
    const res = await request(app).post("/api/otp/verify").send({ email: "real@test.com", code: "482913" });
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

  it("enforces the resend cooldown", async () => {
    const first = await request(app).post("/api/otp/send").send({ email: "cooldown@test.com" });
    expect(first.status).toBe(200);

    const second = await request(app).post("/api/otp/send").send({ email: "cooldown@test.com" });
    expect(second.status).toBe(429);
  });
});
