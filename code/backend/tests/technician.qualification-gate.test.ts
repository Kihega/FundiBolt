import request from "supertest";

const CUSTOMER_ID = "22222222-2222-2222-2222-222222222222";

let technicianRows: any[] = [];

jest.mock("../src/config/redis", () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
  checkRedisConnection: jest.fn().mockResolvedValue(true),
}));

// Unlike technician.controller.test.ts's mock (which deliberately ignores
// `where` entirely), this one actually applies the qualificationScore
// filter - specifically to prove item 1's core rule: an under-qualified
// technician must never appear in nearby results, no matter how close or
// how fresh their location ping is.
jest.mock("../src/config/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(async ({ where }: any) => {
        const minScore = where?.qualificationScore?.gte ?? 0;
        return technicianRows.filter((row) => (row.qualificationScore ?? 0) >= minScore);
      }),
      update: jest.fn().mockResolvedValue({}),
    },
  },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));

import { app } from "../src/app";
import { signToken } from "../src/utils/jwt";
import { QUALIFICATION_THRESHOLD } from "../src/utils/qualification";

const customerToken = signToken({ userId: CUSTOMER_ID, role: "customer" });

const CUSTOMER_LAT = -6.7924;
const CUSTOMER_LNG = 39.2083;

function technicianRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "tech-1",
    fullName: "Joe Fundi",
    avatarUrl: null,
    specialty: "Plumbing",
    skills: ["Pipes"],
    rating: 4.5,
    latitude: CUSTOMER_LAT + 0.001,
    longitude: CUSTOMER_LNG + 0.001,
    qualificationScore: 0,
    ...overrides,
  };
}

describe("GET /api/technicians/nearby - qualification gate", () => {
  beforeEach(() => {
    technicianRows = [];
  });

  it("excludes a technician below the qualification threshold, even with a perfect location match", async () => {
    technicianRows = [technicianRow({ qualificationScore: QUALIFICATION_THRESHOLD - 1 })];

    const res = await request(app)
      .get(`/api/technicians/nearby?lat=${CUSTOMER_LAT}&lng=${CUSTOMER_LNG}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.technicians).toHaveLength(0);
  });

  it("includes a technician who meets the qualification threshold exactly", async () => {
    technicianRows = [technicianRow({ qualificationScore: QUALIFICATION_THRESHOLD })];

    const res = await request(app)
      .get(`/api/technicians/nearby?lat=${CUSTOMER_LAT}&lng=${CUSTOMER_LNG}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.technicians).toHaveLength(1);
  });

  it("includes a technician above the threshold", async () => {
    technicianRows = [technicianRow({ qualificationScore: 100 })];

    const res = await request(app)
      .get(`/api/technicians/nearby?lat=${CUSTOMER_LAT}&lng=${CUSTOMER_LNG}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.technicians).toHaveLength(1);
  });
});
