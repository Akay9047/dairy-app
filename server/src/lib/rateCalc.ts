/**
 * Rajasthan Dairy Rate Calculator
 * Supports: Fat-based (SNF auto) + Fixed rate
 * Buffalo / Cow alag alag rates
 */

export interface RateConfig {
  rateType: "fat" | "fixed";
  // Fat-based
  fatRatePerKg: number;
  snfRatePerKg: number;
  minRatePerLiter: number;
  useMinRate: boolean;
  buffaloFatRate: number;
  cowFatRate: number;
  buffaloSnfRate: number;
  cowSnfRate: number;
  // Fixed
  buffaloFixedRate: number;
  cowFixedRate: number;
}

export const DEFAULT_RATE_CONFIG: RateConfig = {
  rateType: "fat",
  fatRatePerKg: 800,
  snfRatePerKg: 533,
  minRatePerLiter: 40,
  useMinRate: true,
  buffaloFatRate: 800,
  cowFatRate: 600,
  buffaloSnfRate: 533,
  cowSnfRate: 400,
  buffaloFixedRate: 60,
  cowFixedRate: 40,
};

export function estimateSNF(fatPercent: number, milkType: "BUFFALO" | "COW" | "MIXED"): number {
  let snf: number;
  if (milkType === "BUFFALO") snf = 0.21 * fatPercent + 8.5;
  else if (milkType === "COW") snf = 0.21 * fatPercent + 7.8;
  else snf = 0.21 * fatPercent + 8.2;
  return parseFloat(Math.min(Math.max(snf, 7.5), 10.5).toFixed(2));
}

export function calculateRates(
  liters: number,
  fatPercent: number,
  milkType: "BUFFALO" | "COW" | "MIXED",
  config: RateConfig
): {
  snfPercent: number;
  fatKg: number;
  snfKg: number;
  fatAmount: number;
  snfAmount: number;
  ratePerLiter: number;
  totalAmount: number;
} {
  const snfPercent = estimateSNF(fatPercent, milkType);

  if (config.rateType === "fixed") {
    // Fixed rate — simple calculation
    const ratePerLiter = milkType === "BUFFALO"
      ? config.buffaloFixedRate
      : milkType === "COW"
        ? config.cowFixedRate
        : (config.buffaloFixedRate + config.cowFixedRate) / 2;

    const totalAmount = parseFloat((liters * ratePerLiter).toFixed(2));
    const fatKg = parseFloat(((fatPercent / 100) * liters).toFixed(4));
    const snfKg = parseFloat(((snfPercent / 100) * liters).toFixed(4));

    return {
      snfPercent, fatKg, snfKg,
      fatAmount: 0, snfAmount: 0,
      ratePerLiter, totalAmount,
    };
  }

  // Fat-based calculation
  const fatRate = milkType === "BUFFALO" ? config.buffaloFatRate
    : milkType === "COW" ? config.cowFatRate
      : config.fatRatePerKg;

  const snfRate = milkType === "BUFFALO" ? config.buffaloSnfRate
    : milkType === "COW" ? config.cowSnfRate
      : config.snfRatePerKg;

  const fatKg = parseFloat(((fatPercent / 100) * liters).toFixed(4));
  const snfKg = parseFloat(((snfPercent / 100) * liters).toFixed(4));
  const fatAmount = parseFloat((fatKg * fatRate).toFixed(2));
  const snfAmount = parseFloat((snfKg * snfRate).toFixed(2));
  let ratePerLiter = parseFloat(((fatAmount + snfAmount) / liters).toFixed(2));

  if (config.useMinRate && ratePerLiter < config.minRatePerLiter) {
    ratePerLiter = config.minRatePerLiter;
  }

  const totalAmount = parseFloat((ratePerLiter * liters).toFixed(2));
  return { snfPercent, fatKg, snfKg, fatAmount, snfAmount, ratePerLiter, totalAmount };
}