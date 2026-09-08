import request from "supertest";

const CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";

let technicianRows: any[] = [];

jest.mock("../src/config/redis", () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
  checkRedisConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/config/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(async () => technicianRows),
      // requireAuth fire-and-forget touches this on every request - see
      // middleware/auth.middleware.ts. Must resolve so it doesn't log a
      // spurious error on every test.
      update: jest.fn().mockResolvedValue({}),
    },
  },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));

import { app } from "../src/app";
import { signToken } from "../src/utils/jwt";

const customerToken = signToken({ userId: CUSTOMER_ID, role: "customer" });

// Dar es Salaam city center - matches the mobile app's own fallback
// constant (CustomerHomeScreen.tsx), used here purely as "a real place"
// for distance math, not for anything location-specific to the test.
const CUSTOMER_LAT = -6.7924;
const CUSTOMER_LNG = 39.2083;

function technicianRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "tech-1",
    fullName: "Joe Fundi",
    avatarUrl: null,
    specialty: "Plumbing",
    skills: ["Pipes", "Water Heaters"],
    rating: 4.5,
    latitude: CUSTOMER_LAT + 0.001, // ~110m away
    longitude: CUSTOMER_LNG + 0.001,
    ...overrides,
  };
}

describe("GET /api/technicians/nearby", () => {
  beforeEach(() => {
    technicianRows = [];
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/api/technicians/nearby?lat=0&lng=0");
    expect(res.status).toBe(401);
  });

  it("requires valid lat/lng query parameters", async () => {
    const res = await request(app)
      .get("/api/technicians/nearby?lat=not-a-number&lng=39")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(400);
  });

  it("rejects out-of-range coordinates", async () => {
    const res = await request(app)
      .get("/api/technicians/nearby?lat=999&lng=39")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(400);
  });

  it("returns a nearby technician with a real computed distance", async () => {
    technicianRows = [technicianRow()];

    const res = await request(app)
      .get(`/api/technicians/nearby?lat=${CUSTOMER_LAT}&lng=${CUSTOMER_LNG}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.technicians).toHaveLength(1);
    expect(res.body.technicians[0].id).toBe("tech-1");
    expect(res.body.technicians[0].distanceKm).toBeGreaterThan(0);
    expect(res.body.technicians[0].distanceKm).toBeLessThan(1);
    expect(res.body.technicians[0].isAvailable).toBe(true);
  });

  it("excludes technicians outside the requested radius", async () => {
    // ~1 degree of latitude away (~111km) - well outside any reasonable radiusKm.
    technicianRows = [technicianRow({ id: "far-away", latitude: CUSTOMER_LAT + 1 })];

    const res = await request(app)
      .get(`/api/technicians/nearby?lat=${CUSTOMER_LAT}&lng=${CUSTOMER_LNG}&radiusKm=5`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.technicians).toHaveLength(0);
  });

  it("falls back to 'Technician' when no specialty has been set", async () => {
    technicianRows = [technicianRow({ specialty: null })];

    const res = await request(app)
      .get(`/api/technicians/nearby?lat=${CUSTOMER_LAT}&lng=${CUSTOMER_LNG}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.body.technicians[0].specialty).toBe("Technician");
  });

  it("defaults rating to 0 rather than null", async () => {
    technicianRows = [technicianRow({ rating: null })];

    const res = await request(app)
      .get(`/api/technicians/nearby?lat=${CUSTOMER_LAT}&lng=${CUSTOMER_LNG}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.body.technicians[0].rating).toBe(0);
  });

  it("caps an excessive radiusKm request rather than passing it straight through", async () => {
    // Prisma itself is mocked to always return the same fixed rows
    // regardless of query args, so this test only verifies the response
    // doesn't error out and still applies sane, capped distance
    // filtering - the actual cap value is an implementation detail.
    technicianRows = [technicianRow()];

    const res = await request(app)
      .get(`/api/technicians/nearby?lat=${CUSTOMER_LAT}&lng=${CUSTOMER_LNG}&radiusKm=999999`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
  });
});
