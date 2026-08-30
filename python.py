#!/usr/bin/env python3
"""
FundiBolt - Patch 005: Migrate backend from raw pg to Prisma ORM
Run this from the project ROOT folder (~/FundiBolt):
    cd ~/FundiBolt
    python3 005_prisma_migration.py

After running:
    cd code/backend
    npm install
    npx prisma migrate dev --name init
    npm run dev

npx prisma migrate dev reads DATABASE_URL and DATABASE_URL_DIRECT from your
existing .env automatically - no manual psql step needed. It uses
DATABASE_URL_DIRECT for the actual migration (required, since Supabase's
pooler on port 6543 doesn't support the DDL/prepared statements migrations
need), and DATABASE_URL for normal runtime queries.
"""

import os
import json

ROOT = os.getcwd()

def write_file(path, content):
    full_path = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full_path) or ".", exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content.lstrip("\n"))
    print(f"[written] {path}")

def remove_file(path):
    full_path = os.path.join(ROOT, path)
    if os.path.exists(full_path):
        os.remove(full_path)
        print(f"[removed] {path}")
    else:
        print(f"[skipped] {path} not found")


# ---------------------------------------------------------------------------
# PRISMA SCHEMA
# ---------------------------------------------------------------------------

write_file("code/backend/prisma/schema.prisma", """
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_DIRECT")
}

enum Role {
  customer
  fundi
  admin
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  fullName     String   @map("full_name")
  email        String   @unique
  phone        String   @unique
  passwordHash String   @map("password_hash")
  role         Role     @default(customer)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}
""")


# ---------------------------------------------------------------------------
# PRISMA CLIENT SINGLETON (replaces src/config/db.ts)
# ---------------------------------------------------------------------------

write_file("code/backend/src/config/prisma.ts", """
import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance across hot-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.error("Database connection check failed:", err);
    return false;
  }
}
""")

remove_file("code/backend/src/config/db.ts")


# ---------------------------------------------------------------------------
# AUTH CONTROLLER - rewritten to use Prisma
# ---------------------------------------------------------------------------

write_file("code/backend/src/controllers/auth.controller.ts", """
import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";

export async function signup(req: Request, res: Response) {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ message: "fullName, email, phone, and password are all required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      return res.status(409).json({ message: "An account with this email or phone already exists." });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { fullName, email, phone, passwordHash },
      select: { id: true, fullName: true, email: true, phone: true, role: true, createdAt: true },
    });

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Something went wrong during signup." });
  }
}

export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Email/phone and password are required." });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Something went wrong during login." });
  }
}
""")


# ---------------------------------------------------------------------------
# INDEX.TS - point health check at prisma instead of pg
# ---------------------------------------------------------------------------

write_file("code/backend/src/index.ts", """
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { checkDbConnection } from "./config/prisma";
import { checkRedisConnection } from "./config/redis";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  const dbOk = await checkDbConnection();
  const redisOk = await checkRedisConnection();
  const healthy = dbOk && redisOk;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    database: dbOk ? "connected" : "unreachable",
    redis: redisOk ? "connected" : "unreachable",
    env: env.nodeEnv,
  });
});

app.get("/", (_req, res) => {
  res.json({ message: "FundiBolt API is running" });
});

app.use("/api/auth", authRoutes);

app.listen(env.port, () => {
  console.log(`FundiBolt backend listening on port ${env.port}`);
});
""")


# ---------------------------------------------------------------------------
# DEPRECATE OLD RAW SQL MIGRATION (Prisma now owns migrations)
# ---------------------------------------------------------------------------

write_file("code/backend/src/db/migrations/DEPRECATED.md", """
# Deprecated

The `001_create_users_table.sql` file in this folder is no longer used.

As of Patch 005, database schema and migrations are managed by **Prisma**
(`code/backend/prisma/schema.prisma`). Run:

    npx prisma migrate dev --name init

to create and apply migrations going forward. Prisma stores its own
migration history in `code/backend/prisma/migrations/`.
""")


# ---------------------------------------------------------------------------
# PACKAGE.JSON - swap pg for prisma
# ---------------------------------------------------------------------------

pkg_path = os.path.join(ROOT, "code/backend/package.json")
if os.path.exists(pkg_path):
    with open(pkg_path, "r") as f:
        pkg = json.load(f)

    deps = pkg.setdefault("dependencies", {})
    deps.pop("pg", None)
    deps["@prisma/client"] = "^5.19.0"

    dev_deps = pkg.setdefault("devDependencies", {})
    dev_deps.pop("@types/pg", None)
    dev_deps["prisma"] = "^5.19.0"

    scripts = pkg.setdefault("scripts", {})
    scripts["postinstall"] = "prisma generate"
    scripts["prisma:migrate"] = "prisma migrate dev"
    scripts["prisma:studio"] = "prisma studio"

    with open(pkg_path, "w") as f:
        json.dump(pkg, f, indent=2)
    print("[updated] code/backend/package.json (removed pg, added prisma + @prisma/client)")
else:
    print("[skipped] code/backend/package.json not found")


print("\nDone. Next steps:")
print("  cd code/backend")
print("  npm install")
print("  npx prisma migrate dev --name init")
print("  npm run dev")
