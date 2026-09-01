-- Sync the applied database schema with prisma/schema.prisma.
-- The initial migration (20260830160652_init) was generated before
-- `emailVerified` was added to the User model, and it also created
-- `phone` as NOT NULL even though the schema declares it optional
-- (`phone String?`). This migration brings the database back in line
-- with the schema so Prisma Client queries (e.g. selecting
-- emailVerified during signup) stop failing with P2022.

ALTER TABLE "users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
