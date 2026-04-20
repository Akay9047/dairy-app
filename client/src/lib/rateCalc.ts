export interface RateConfig {
  pricingMode: "fat_snf" | "fat_only" | "fixed";
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
  let snf = milkType === "BUFFALO" ? 0.21 * fat + 8.5
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
  const snfPercent = (snfInput && snfInput > 0) ? snfInput
    : config.autoCalcSnf ? calcSNF(fat, clr, milkType) : 0;

  const fatKg = (fat / 100) * liters;
  const snfKg = (snfPercent / 100) * liters;

  let ratePerLiter: number;
  let fatAmount: number;
  let snfAmount = 0;
  let formula = "";

  if (config.pricingMode === "fixed") {
    ratePerLiter = milkType === "BUFFALO" ? config.buffaloFixedRate
      : milkType === "COW" ? config.cowFixedRate
        : (config.buffaloFixedRate + config.cowFixedRate) / 2;
    fatAmount = 0;
    formula = `Fixed ₹${ratePerLiter}/L`;

  } else if (config.pricingMode === "fat_only") {
    fatAmount = fat * config.fatRate;
    ratePerLiter = fatAmount;
    formula = `${fat}% × ₹${config.fatRate} = ₹${ratePerLiter.toFixed(2)}/L`;

  } else {
    fatAmount = fat * config.fatRate;
    snfAmount = snfPercent * config.snfRate;
    ratePerLiter = fatAmount + snfAmount;
    formula = `Fat(${fat}%×${config.fatRate}) + SNF(${snfPercent}%×${config.snfRate}) = ₹${ratePerLiter.toFixed(2)}/L`;
  }

  if (config.useMinRate && ratePerLiter < config.minRatePerLiter) {
    ratePerLiter = config.minRatePerLiter;
  }

  return {
    snfPercent,
    fatKg: parseFloat(fatKg.toFixed(3)),
    snfKg: parseFloat(snfKg.toFixed(3)),
    fatAmount: parseFloat(fatAmount.toFixed(2)),
    snfAmount: parseFloat(snfAmount.toFixed(2)),
    ratePerLiter: parseFloat(ratePerLiter.toFixed(2)),
    totalAmount: parseFloat((ratePerLiter * liters).toFixed(2)),
    formula,
  };
}