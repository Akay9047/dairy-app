/*
  Warnings:

  - You are about to drop the column `buffaloFatRate` on the `RateConfig` table. All the data in the column will be lost.
  - You are about to drop the column `buffaloSnfRate` on the `RateConfig` table. All the data in the column will be lost.
  - You are about to drop the column `cowFatRate` on the `RateConfig` table. All the data in the column will be lost.
  - You are about to drop the column `cowSnfRate` on the `RateConfig` table. All the data in the column will be lost.
  - You are about to drop the column `fatRatePerKg` on the `RateConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rateType` on the `RateConfig` table. All the data in the column will be lost.
  - You are about to drop the column `snfRatePerKg` on the `RateConfig` table. All the data in the column will be lost.
  - You are about to drop the column `useSnf` on the `RateConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MilkEntry" ADD COLUMN     "clr" DOUBLE PRECISION,
ADD COLUMN     "formula" TEXT,
ALTER COLUMN "snfPercent" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "RateConfig" DROP COLUMN "buffaloFatRate",
DROP COLUMN "buffaloSnfRate",
DROP COLUMN "cowFatRate",
DROP COLUMN "cowSnfRate",
DROP COLUMN "fatRatePerKg",
DROP COLUMN "rateType",
DROP COLUMN "snfRatePerKg",
DROP COLUMN "useSnf",
ADD COLUMN     "autoCalcSnf" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.33,
ADD COLUMN     "pricingMode" TEXT NOT NULL DEFAULT 'fat_only',
ADD COLUMN     "snfRate" DOUBLE PRECISION NOT NULL DEFAULT 0.07,
ALTER COLUMN "minRatePerLiter" SET DEFAULT 25.0,
ALTER COLUMN "useMinRate" SET DEFAULT false;
