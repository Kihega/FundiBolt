import request from "supertest";

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
        const user = { id: String(idCounter++), ...data, emailVerified: false, createdAt: new Date() };
        usersByEmail.set(data.email, user);
        return user;
      }),
    },
  },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/config/redis", () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
  checkRedisConnection: jest.fn().mockResolvedValue(true),
}));

import { app } from "../src/app";

describe("POST /api/auth/signup - role handling", () => {
  beforeEach(() => {
    usersByEmail.clear();
    idCounter = 1;
  });

  it("defaults to customer when no role is provided", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      fullName: "Jane Doe",
      email: "jane@test.com",
      password: "correcthorse",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("customer");
  });

  it("accepts fundi as a self-selected role", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      fullName: "Joe Fundi",
      email: "joe@test.com",
      password: "correcthorse",
      role: "fundi",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("fundi");
  });

  // Security regression test: role is client-supplied input. Even if a
  // request explicitly asks for "admin", the server must never honor it -
  // only "customer" and "fundi" are self-selectable at signup.
  it("never grants admin via signup, even if explicitly requested", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      fullName: "Sneaky Admin",
      email: "sneaky@test.com",
      password: "correcthorse",
      role: "admin",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("customer");
  });

  it("falls back to customer for a garbage role value", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      fullName: "Random Person",
      email: "random@test.com",
      password: "correcthorse",
      role: "super-user",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("customer");
  });
});
