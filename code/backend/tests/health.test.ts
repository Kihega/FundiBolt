import request from "supertest";

jest.mock("../src/config/prisma", () => ({
  prisma: { user: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() } },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));
jest.mock("../src/config/redis", () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
  checkRedisConnection: jest.fn().mockResolvedValue(true),
}));

import { app } from "../src/app";

describe("GET /health", () => {
  it("returns 200 and ok status when dependencies are healthy", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.database).toBe("connected");
    expect(res.body.redis).toBe("connected");
  });

  // Basic security posture check - helmet should be active.
  it("sets helmet security headers and hides x-powered-by", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("GET /", () => {
  it("returns a running message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/running/i);
  });
});
