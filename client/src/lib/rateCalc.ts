export interface RateConfig {
  rateType: "fat" | "fixed";
  useSnf: boolean;
  fatRatePerKg: number; snfRatePerKg: number;
  minRatePerLiter: number; useMinRate: boolean;
  buffaloFatRate: number; cowFatRate: number;
  buffaloSnfRate: number; cowSnfRate: number;
  buffaloFixedRate: number; cowFixedRate: number;
}

export const DEFAULT_CONFIG: RateConfig = {
  rateType: "fat", useSnf: false,
  fatRatePerKg: 800, snfRatePerKg: 533,
  minRatePerLiter: 40, useMinRate: true,
  buffaloFatRate: 800, cowFatRate: 600,
  buffaloSnfRate: 533, cowSnfRate: 400,
  buffaloFixedRate: 60, cowFixedRate: 40,
};

export function estimateSNF(fat: number, milkType: string): number {
  let snf: number;
  if (milkType === "BUFFALO") snf = 0.21 * fat + 8.5;
  else if (milkType === "COW") snf = 0.21 * fat + 7.8;
  else snf = 0.21 * fat + 8.2;
  return parseFloat(Math.min(Math.max(snf, 7.5), 10.5).toFixed(2));
}

export function calcRates(liters: number, fat: number, milkType: string, config: RateConfig) {
  const snfPercent = estimateSNF(fat, milkType);
  const fatKg = (fat / 100) * liters;
  const snfKg = (snfPercent / 100) * liters;

  if (config.rateType === "fixed") {
    const ratePerLiter = milkType === "BUFFALO" ? config.buffaloFixedRate
      : milkType === "COW" ? config.cowFixedRate
        : (config.buffaloFixedRate + config.cowFixedRate) / 2;
    return {
      snfPercent, fatKg, snfKg, fatAmount: 0, snfAmount: 0,
      ratePerLiter: parseFloat(ratePerLiter.toFixed(2)),
      totalAmount: parseFloat((liters * ratePerLiter).toFixed(2)),
    };
  }

  const fatRate = milkType === "BUFFALO" ? config.buffaloFatRate
    : milkType === "COW" ? config.cowFatRate : config.fatRatePerKg;
  const snfRate = milkType === "BUFFALO" ? config.buffaloSnfRate
    : milkType === "COW" ? config.cowSnfRate : config.snfRatePerKg;

  const fatAmount = fatKg * fatRate;
  const snfAmount = config.useSnf ? snfKg * snfRate : 0;
  let ratePerLiter = (fatAmount + snfAmount) / liters;

  if (config.useMinRate && ratePerLiter < config.minRatePerLiter) {
    ratePerLiter = config.minRatePerLiter;
  }

  return {
    snfPercent,
    fatKg: parseFloat(fatKg.toFixed(4)),
    snfKg: parseFloat(snfKg.toFixed(4)),
    fatAmount: parseFloat(fatAmount.toFixed(2)),
    snfAmount: parseFloat(snfAmount.toFixed(2)),
    ratePerLiter: parseFloat(ratePerLiter.toFixed(2)),
    totalAmount: parseFloat((ratePerLiter * liters).toFixed(2)),
  };
}