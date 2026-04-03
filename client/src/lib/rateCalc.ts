// Mirror of server calculation for live preview
export interface RateConfig {
  fatRatePerKg: number;
  snfRatePerKg: number;
  minRatePerLiter: number;
  useMinRate: boolean;
  milkType?: "cow" | "buffalo" | "mixed";
}

export const DEFAULT_CONFIG: RateConfig = {
  fatRatePerKg: 800,
  snfRatePerKg: 533,
  minRatePerLiter: 40,
  useMinRate: true,
  milkType: "mixed",
};

export function estimateSNF(fat: number, milkType: string = "mixed"): number {
  let snf: number;
  if (milkType === "buffalo") snf = 0.21 * fat + 8.5;
  else if (milkType === "cow") snf = 0.21 * fat + 7.8;
  else snf = 0.21 * fat + 8.2;
  return parseFloat(Math.min(Math.max(snf, 7.5), 10.5).toFixed(2));
}

export function calcRates(liters: number, fat: number, config: RateConfig) {
  const snfPercent = estimateSNF(fat, config.milkType);
  const fatKg = parseFloat(((fat / 100) * liters).toFixed(4));
  const snfKg = parseFloat(((snfPercent / 100) * liters).toFixed(4));
  const fatAmount = parseFloat((fatKg * config.fatRatePerKg).toFixed(2));
  const snfAmount = parseFloat((snfKg * config.snfRatePerKg).toFixed(2));
  let ratePerLiter = parseFloat(((fatAmount + snfAmount) / liters).toFixed(2));
  if (config.useMinRate && ratePerLiter < config.minRatePerLiter) {
    ratePerLiter = config.minRatePerLiter;
  }
  const totalAmount = parseFloat((ratePerLiter * liters).toFixed(2));
  return { snfPercent, fatKg, snfKg, fatAmount, snfAmount, ratePerLiter, totalAmount };
}
