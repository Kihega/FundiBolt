import request from "supertest";

const FUNDI_ID = "44444444-4444-4444-4444-444444444444";
const CUSTOMER_ID = "55555555-5555-5555-5555-555555555555";

let currentUser: any;
const updateMock = jest.fn(async ({ data }: any) => {
  currentUser = { ...currentUser, ...data };
  return currentUser;
});

jest.mock("../src/config/redis", () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
  checkRedisConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/config/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(async () => currentUser),
      update: (...args: unknown[]) => updateMock(...(args as [any])),
    },
  },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));

import { app } from "../src/app";
import { signToken } from "../src/utils/jwt";

const fundiToken = signToken({ userId: FUNDI_ID, role: "fundi" });
const customerToken = signToken({ userId: CUSTOMER_ID, role: "customer" });

function freshUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: FUNDI_ID,
    fullName: "Joe Fundi",
    email: "joe@test.com",
    phone: "+255700000000",
    role: "fundi",
    emailVerified: true,
    avatarUrl: null,
    specialty: null,
    skills: [],
    bio: null,
    hourlyRate: null,
    yearsExperience: null,
    idDocumentUrl: null,
    qualificationScore: 0,
    ...overrides,
  };
}

describe("PATCH /api/users/me/technician-profile", () => {
  beforeEach(() => {
    currentUser = freshUser();
    updateMock.mockClear();
  });

  it("requires authentication", async () => {
    const res = await request(app).patch("/api/users/me/technician-profile").send({ bio: "hello" });
    expect(res.status).toBe(401);
  });

  it("is restricted to technician (fundi) accounts - customers get 403", async () => {
    const res = await request(app)
      .patch("/api/users/me/technician-profile")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bio: "hello" });
    expect(res.status).toBe(403);
  });

  it("rejects a skills value that isn't an array of strings", async () => {
    const res = await request(app)
      .patch("/api/users/me/technician-profile")
      .set("Authorization", `Bearer ${fundiToken}`)
      .send({ skills: "not-an-array" });
    expect(res.status).toBe(400);
  });

  it("rejects a negative hourlyRate", async () => {
    const res = await request(app)
      .patch("/api/users/me/technician-profile")
      .set("Authorization", `Bearer ${fundiToken}`)
      .send({ hourlyRate: -5 });
    expect(res.status).toBe(400);
  });

  it("updates fields and recomputes qualificationScore from the FULL resulting profile", async () => {
    // Start already having avatarUrl + phone set (worth 15 + 10 = 25).
    currentUser = freshUser({ avatarUrl: "/uploads/avatars/x.jpg" });

    const res = await request(app)
      .patch("/api/users/me/technician-profile")
      .set("Authorization", `Bearer ${fundiToken}`)
      .send({
        specialty: "Plumbing",
        skills: ["pipe fitting", "leak repair", "installation"],
        bio: "A".repeat(60),
        hourlyRate: 15000,
        yearsExperience: 4,
      });

    expect(res.status).toBe(200);
    // avatarUrl(15) + phone(10) + specialty(10) + skills(15) + bio(15) +
    // hourlyRate(10) + yearsExperience(5) = 80. Missing only idDocument(20).
    expect(res.body.user.qualificationScore).toBe(80);
  });

  it("never accepts a partial update that leaves qualificationScore stale", async () => {
    currentUser = freshUser({
      avatarUrl: "/uploads/avatars/x.jpg",
      specialty: "Electrician",
      skills: ["wiring", "panel install", "troubleshooting"],
      bio: "A".repeat(60),
      hourlyRate: 20000,
      yearsExperience: 3,
      idDocumentUrl: "/uploads/id-documents/x.jpg",
      qualificationScore: 90,
    });

    // Removing the bio (clearing it) should bring the score back down,
    // not leave the old stored value untouched.
    const res = await request(app)
      .patch("/api/users/me/technician-profile")
      .set("Authorization", `Bearer ${fundiToken}`)
      .send({ bio: "" });

    expect(res.status).toBe(200);
    expect(res.body.user.qualificationScore).toBe(85); // 100 - bio's 15 points
  });
});
