-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('ALLOW', 'DENY');

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "url" VARCHAR(500);

-- AlterTable
ALTER TABLE "role_permissions" ADD COLUMN     "access_type" "AccessType" NOT NULL DEFAULT 'ALLOW';

-- AlterTable
ALTER TABLE "user_permissions" ADD COLUMN     "access_type" "AccessType" NOT NULL DEFAULT 'ALLOW';

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
