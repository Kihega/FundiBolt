-- Adds technician qualification/onboarding fields used to compute
-- qualificationScore (see src/utils/qualification.ts). A technician only
-- appears in customer nearby-search results once this score reaches the
-- QUALIFICATION_THRESHOLD (technician.controller.ts) - meaningless for
-- customer/admin accounts, which simply keep the defaults below.

ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "hourly_rate" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "years_experience" INTEGER;
ALTER TABLE "users" ADD COLUMN "id_document_url" TEXT;
ALTER TABLE "users" ADD COLUMN "qualification_score" INTEGER NOT NULL DEFAULT 0;
