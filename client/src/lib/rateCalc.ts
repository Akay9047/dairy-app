/**
 * Smart Dairy Solution - Rate Calculator
 * 3 Modes:
 * 1. fat_only  → Rate = Fat% × fatRate
 * 2. fat_snf   → Rate = (Fat% × fatRate) + (SNF% × snfRate)  
 * 3. fixed     → Rate = buffaloFixedRate or cowFixedRate
 */

export interface RateConfig {
  pricingMode: "fat_only" | "fat_snf" | "fixed";
  fatRate: number;
  snfRate: number;
  buffaloFixedRate: number;
  cowFixedRate: number;
  minRatePerLiter: number;
  useMinRate: boolean;
  autoCalcSnf: boolean;
}

export const DEFAULT_CONFIG: RateConfig = {
  pricingMode: "fat_only",
  fatRate: 0.33,
  snfRate: 0.07,
  buffaloFixedRate: 60,
  cowFixedRate: 40,
  minRatePerLiter: 25,
  useMinRate: false,
  autoCalcSnf: true,
};

export function calcSNF(fat: number, clr?: number, milkType?: string): number {
  if (clr && clr > 0) {
    return parseFloat(Math.min(Math.max((clr / 4) + (0.25 * fat) + 0.44, 7.0), 11.0).toFixed(2));
  }
  const snf = milkType === "BUFFALO" ? 0.21 * fat + 8.5
    : milkType === "COW" ? 0.21 * fat + 7.9
      : 0.21 * fat + 8.2;
  return parseFloat(Math.min(Math.max(snf, 7.0), 11.0).toFixed(2));
}

export function calcRates(
  liters: number,
  fat: number,
  milkType: string,
  config: RateConfig,
  snfInput?: number,
  clr?: number
) {
  const snfPercent = (config.pricingMode === "fat_snf")
    ? (snfInput && snfInput > 0 ? snfInput : (config.autoCalcSnf ? calcSNF(fat, clr, milkType) : 0))
    : calcSNF(fat, clr, milkType); // always calc for display, just dont use in rate

  const fatKg = parseFloat(((fat / 100) * liters).toFixed(3));
  const snfKg = parseFloat(((snfPercent / 100) * liters).toFixed(3));

  let ratePerLiter: number;
  let fatAmount: number = 0;
  let snfAmount: number = 0;
  let formula: string = "";

  if (config.pricingMode === "fixed") {
    ratePerLiter = milkType === "BUFFALO" ? config.buffaloFixedRate
      : milkType === "COW" ? config.cowFixedRate
        : (config.buffaloFixedRate + config.cowFixedRate) / 2;
    formula = `Fixed ₹${ratePerLiter}/L`;

  } else if (config.pricingMode === "fat_snf") {
    fatAmount = fat * config.fatRate;
    snfAmount = snfPercent * config.snfRate;
    ratePerLiter = fatAmount + snfAmount;
    formula = `Fat ${fat}%×₹${config.fatRate} + SNF ${snfPercent}%×₹${config.snfRate} = ₹${ratePerLiter.toFixed(2)}/L`;

  } else {
    // fat_only (default)
    fatAmount = fat * config.fatRate;
    ratePerLiter = fatAmount;
    formula = `Fat ${fat}% × ₹${config.fatRate} = ₹${ratePerLiter.toFixed(2)}/L`;
  }

  if (config.useMinRate && ratePerLiter < config.minRatePerLiter) {
    ratePerLiter = config.minRatePerLiter;
    formula += ` → Min ₹${config.minRatePerLiter} applied`;
  }

  return {
    snfPercent,
    fatKg,
    snfKg,
    fatAmount: parseFloat(fatAmount.toFixed(2)),
    snfAmount: parseFloat(snfAmount.toFixed(2)),
    ratePerLiter: parseFloat(ratePerLiter.toFixed(2)),
    totalAmount: parseFloat((ratePerLiter * liters).toFixed(2)),
    formula,
  };
}