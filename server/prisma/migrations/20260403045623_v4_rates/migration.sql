-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MORNING', 'EVENING');

-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dairy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accessPaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "superAdminId" TEXT NOT NULL,

    CONSTRAINT "Dairy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dairyId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'hinglish',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateConfig" (
    "id" TEXT NOT NULL,
    "dairyId" TEXT NOT NULL,
    "fatRatePerKg" DOUBLE PRECISION NOT NULL DEFAULT 800.0,
    "snfRatePerKg" DOUBLE PRECISION NOT NULL DEFAULT 533.0,
    "minRatePerLiter" DOUBLE PRECISION NOT NULL DEFAULT 40.0,
    "useMinRate" BOOLEAN NOT NULL DEFAULT true,
    "milkType" TEXT NOT NULL DEFAULT 'mixed',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farmer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dairyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilkEntry" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "dairyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shift" "Shift" NOT NULL DEFAULT 'MORNING',
    "liters" DOUBLE PRECISION NOT NULL,
    "fatPercent" DOUBLE PRECISION NOT NULL,
    "snfPercent" DOUBLE PRECISION NOT NULL,
    "fatKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "snfKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "snfAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratePerLiter" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilkEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "dairyId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_username_key" ON "SuperAdmin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "RateConfig_dairyId_key" ON "RateConfig"("dairyId");

-- CreateIndex
CREATE INDEX "Farmer_dairyId_idx" ON "Farmer"("dairyId");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_mobile_dairyId_key" ON "Farmer"("mobile", "dairyId");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_code_dairyId_key" ON "Farmer"("code", "dairyId");

-- CreateIndex
CREATE INDEX "MilkEntry_farmerId_idx" ON "MilkEntry"("farmerId");

-- CreateIndex
CREATE INDEX "MilkEntry_dairyId_idx" ON "MilkEntry"("dairyId");

-- CreateIndex
CREATE INDEX "MilkEntry_date_idx" ON "MilkEntry"("date");

-- CreateIndex
CREATE INDEX "MilkEntry_dairyId_date_idx" ON "MilkEntry"("dairyId", "date");

-- CreateIndex
CREATE INDEX "Payment_farmerId_idx" ON "Payment"("farmerId");

-- CreateIndex
CREATE INDEX "Payment_dairyId_idx" ON "Payment"("dairyId");

-- CreateIndex
CREATE INDEX "Payment_dairyId_paidAt_idx" ON "Payment"("dairyId", "paidAt");

-- AddForeignKey
ALTER TABLE "Dairy" ADD CONSTRAINT "Dairy_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_dairyId_fkey" FOREIGN KEY ("dairyId") REFERENCES "Dairy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateConfig" ADD CONSTRAINT "RateConfig_dairyId_fkey" FOREIGN KEY ("dairyId") REFERENCES "Dairy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_dairyId_fkey" FOREIGN KEY ("dairyId") REFERENCES "Dairy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkEntry" ADD CONSTRAINT "MilkEntry_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkEntry" ADD CONSTRAINT "MilkEntry_dairyId_fkey" FOREIGN KEY ("dairyId") REFERENCES "Dairy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_dairyId_fkey" FOREIGN KEY ("dairyId") REFERENCES "Dairy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
