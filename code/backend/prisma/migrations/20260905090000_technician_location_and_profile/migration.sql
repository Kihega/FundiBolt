-- Adds live location (for the customer home map's "spot nearby online
-- technicians" feature) and a minimal technician-profile shape
-- (specialty/skills/rating) that the mobile client's Technician type
-- already expects (see mobile: services/technicians.ts). Hand-authored
-- (no live database available to run `prisma migrate dev` against here)
-- - same situation as the two migrations before this one.

-- AlterTable: live location, technician accounts only (see User.latitude
-- doc-comment in schema.prisma)
ALTER TABLE "users" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "location_updated_at" TIMESTAMP(3);

-- AlterTable: minimal technician-profile fields
ALTER TABLE "users" ADD COLUMN "specialty" TEXT;
ALTER TABLE "users" ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN "rating" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "rating_count" INTEGER NOT NULL DEFAULT 0;

-- Nearby-technician lookups (GET /api/technicians/nearby) always filter
-- on role = 'fundi' AND location_updated_at recent - this composite index
-- keeps that filter fast as the users table grows, without needing a
-- geospatial extension (distance itself is computed in application code
-- via the Haversine formula - see src/utils/geo.ts - since the candidate
-- pool after this filter is small).
CREATE INDEX "users_role_location_updated_at_idx" ON "users"("role", "location_updated_at");
