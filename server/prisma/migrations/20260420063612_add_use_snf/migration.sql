-- DropIndex
DROP INDEX "MilkEntry_date_idx";

-- AlterTable
ALTER TABLE "RateConfig" ADD COLUMN     "useSnf" BOOLEAN NOT NULL DEFAULT false;
