import request from "supertest";

const FUNDI_ID = "22222222-2222-2222-2222-222222222222";
const CUSTOMER_ID = "33333333-3333-3333-3333-333333333333";

const updateMock = jest.fn().mockResolvedValue({});

jest.mock("../src/config/redis", () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
  checkRedisConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/config/prisma", () => ({
  prisma: {
    user: {
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));

import { app } from "../src/app";
import { signToken } from "../src/utils/jwt";

const fundiToken = signToken({ userId: FUNDI_ID, role: "fundi" });
const customerToken = signToken({ userId: CUSTOMER_ID, role: "customer" });

describe("PATCH /api/users/me/location", () => {
  beforeEach(() => {
    updateMock.mockClear();
    updateMock.mockResolvedValue({});
  });

  it("requires authentication", async () => {
    const res = await request(app).patch("/api/users/me/location").send({ latitude: 1, longitude: 1 });
    expect(res.status).toBe(401);
  });

  it("is restricted to technician (fundi) accounts - customers get 403", async () => {
    const res = await request(app)
      .patch("/api/users/me/location")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ latitude: 1, longitude: 1 });
    expect(res.status).toBe(403);
  });

  it("rejects missing coordinates", async () => {
    const res = await request(app)
      .patch("/api/users/me/location")
      .set("Authorization", `Bearer ${fundiToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("rejects out-of-range latitude", async () => {
    const res = await request(app)
      .patch("/api/users/me/location")
      .set("Authorization", `Bearer ${fundiToken}`)
      .send({ latitude: 999, longitude: 39 });
    expect(res.status).toBe(400);
  });

  it("accepts valid coordinates and persists them with a fresh timestamp", async () => {
    const res = await request(app)
      .patch("/api/users/me/location")
      .set("Authorization", `Bearer ${fundiToken}`)
      .send({ latitude: -6.7924, longitude: 39.2083 });

    expect(res.status).toBe(200);
    // Called once for requireAuth's fire-and-forget lastActiveAt touch,
    // and once for the actual location update - find the location one.
    const locationCall = updateMock.mock.calls.find((call) => call[0]?.data?.latitude !== undefined);
    expect(locationCall).toBeDefined();
    expect(locationCall[0].where).toEqual({ id: FUNDI_ID });
    expect(locationCall[0].data.latitude).toBe(-6.7924);
    expect(locationCall[0].data.longitude).toBe(39.2083);
    expect(locationCall[0].data.locationUpdatedAt).toBeInstanceOf(Date);
  });
});
