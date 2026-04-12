/*
  Warnings:

  - You are about to drop the column `milkType` on the `RateConfig` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MilkType" AS ENUM ('BUFFALO', 'COW', 'MIXED');

-- DropIndex
DROP INDEX "MilkEntry_dairyId_date_idx";

-- DropIndex
DROP INDEX "MilkEntry_dairyId_idx";

-- DropIndex
DROP INDEX "MilkEntry_farmerId_idx";

-- DropIndex
DROP INDEX "Payment_dairyId_paidAt_idx";

-- AlterTable
ALTER TABLE "MilkEntry" ADD COLUMN     "milkType" "MilkType" NOT NULL DEFAULT 'MIXED';

-- AlterTable
ALTER TABLE "RateConfig" DROP COLUMN "milkType",
ADD COLUMN     "buffaloFatRate" DOUBLE PRECISION NOT NULL DEFAULT 800.0,
ADD COLUMN     "buffaloFixedRate" DOUBLE PRECISION NOT NULL DEFAULT 60.0,
ADD COLUMN     "buffaloSnfRate" DOUBLE PRECISION NOT NULL DEFAULT 533.0,
ADD COLUMN     "cowFatRate" DOUBLE PRECISION NOT NULL DEFAULT 600.0,
ADD COLUMN     "cowFixedRate" DOUBLE PRECISION NOT NULL DEFAULT 40.0,
ADD COLUMN     "cowSnfRate" DOUBLE PRECISION NOT NULL DEFAULT 400.0,
ADD COLUMN     "rateType" TEXT NOT NULL DEFAULT 'fat';

-- CreateIndex
CREATE INDEX "Admin_dairyId_idx" ON "Admin"("dairyId");

-- CreateIndex
CREATE INDEX "Dairy_superAdminId_idx" ON "Dairy"("superAdminId");

-- CreateIndex
CREATE INDEX "Dairy_isActive_idx" ON "Dairy"("isActive");

-- CreateIndex
CREATE INDEX "Farmer_dairyId_isActive_idx" ON "Farmer"("dairyId", "isActive");

-- CreateIndex
CREATE INDEX "MilkEntry_dairyId_date_idx" ON "MilkEntry"("dairyId", "date" DESC);

-- CreateIndex
CREATE INDEX "MilkEntry_farmerId_date_idx" ON "MilkEntry"("farmerId", "date" DESC);

-- CreateIndex
CREATE INDEX "MilkEntry_dairyId_farmerId_idx" ON "MilkEntry"("dairyId", "farmerId");

-- CreateIndex
CREATE INDEX "Payment_dairyId_paidAt_idx" ON "Payment"("dairyId", "paidAt" DESC);
