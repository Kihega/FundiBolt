-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_technician_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropIndex
DROP INDEX "users_role_location_updated_at_idx";

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
