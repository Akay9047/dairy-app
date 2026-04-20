/**
 * Smart Dairy Solution - Complete Rate Calculator
 * 3 Modes:
 * 1. Fat + SNF based
 * 2. Fat Only
 * 3. Fixed Rate per liter
 */

export interface RateConfig {
  pricingMode: "fat_snf" | "fat_only" | "fixed";
  // Fat rates
  fatRate: number;       // ₹ per % per liter (or per kg)
  snfRate: number;       // ₹ per % per liter
  // Fixed rates
  buffaloFixedRate: number;
  cowFixedRate: number;
  // Min rate
  minRatePerLiter: number;
  useMinRate: boolean;
  // SNF auto calc
  autoCalcSnf: boolean;
}

export const DEFAULT_RATE_CONFIG: RateConfig = {
  pricingMode: "fat_only",
  fatRate: 0.33,         // ₹0.33 per % per liter → Fat 6% × 0.33 = ₹1.98/L
  snfRate: 0.07,
  buffaloFixedRate: 60,
  cowFixedRate: 40,
  minRatePerLiter: 25,
  useMinRate: false,
  autoCalcSnf: true,
};

/**
 * SNF auto calculation
 * Formula: SNF = (CLR / 4) + (0.25 * FAT) + 0.44
 * If CLR not available: SNF = 0.21 * FAT + 8.5 (buffalo) / 7.9 (cow)
 */
export function calcSNF(fat: number, clr?: number, milkType?: string): number {
  if (clr && clr > 0) {
    const snf = (clr / 4) + (0.25 * fat) + 0.44;
    return parseFloat(Math.min(Math.max(snf, 7.0), 11.0).toFixed(2));
  }
  // Fallback formula based on milk type
  let snf: number;
  if (milkType === "BUFFALO") snf = 0.21 * fat + 8.5;
  else if (milkType === "COW") snf = 0.21 * fat + 7.9;
  else snf = 0.21 * fat + 8.2;
  return parseFloat(Math.min(Math.max(snf, 7.0), 11.0).toFixed(2));
}

export interface CalcResult {
  snfPercent: number;
  fatKg: number;
  snfKg: number;
  fatAmount: number;
  snfAmount: number;
  ratePerLiter: number;
  totalAmount: number;
  formula: string;       // Show user what formula was used
}

export function calculateRates(
  liters: number,
  fatPercent: number,
  milkType: "BUFFALO" | "COW" | "MIXED",
  config: RateConfig,
  snfInput?: number,     // Manual SNF input
  clr?: number,          // CLR input
): CalcResult {

  // Calculate SNF
  let snfPercent: number;
  if (snfInput && snfInput > 0) {
    snfPercent = snfInput;  // Manual entry
  } else if (config.autoCalcSnf) {
    snfPercent = calcSNF(fatPercent, clr, milkType);
  } else {
    snfPercent = 0;
  }

  const fatKg = parseFloat(((fatPercent / 100) * liters).toFixed(4));
  const snfKg = parseFloat(((snfPercent / 100) * liters).toFixed(4));

  let ratePerLiter: number;
  let fatAmount: number;
  let snfAmount = 0;
  let formula = "";

  if (config.pricingMode === "fixed") {
    ratePerLiter = milkType === "BUFFALO" ? config.buffaloFixedRate
      : milkType === "COW" ? config.cowFixedRate
        : (config.buffaloFixedRate + config.cowFixedRate) / 2;
    fatAmount = 0;
    formula = `Fixed: ₹${ratePerLiter}/L`;

  } else if (config.pricingMode === "fat_only") {
    // price_per_liter = fat% * fat_rate
    fatAmount = fatPercent * config.fatRate;
    ratePerLiter = fatAmount;
    formula = `Fat ${fatPercent}% × ₹${config.fatRate} = ₹${ratePerLiter.toFixed(2)}/L`;

  } else {
    // fat_snf mode
    // price_per_liter = (fat% * fat_rate) + (snf% * snf_rate)
    fatAmount = fatPercent * config.fatRate;
    snfAmount = snfPercent * config.snfRate;
    ratePerLiter = fatAmount + snfAmount;
    formula = `Fat ${fatPercent}%×₹${config.fatRate} + SNF ${snfPercent}%×₹${config.snfRate} = ₹${ratePerLiter.toFixed(2)}/L`;
  }

  // Min rate guarantee
  if (config.useMinRate && ratePerLiter < config.minRatePerLiter) {
    ratePerLiter = config.minRatePerLiter;
    formula += ` (min ₹${config.minRatePerLiter} applied)`;
  }

  const totalAmount = parseFloat((ratePerLiter * liters).toFixed(2));

  return {
    snfPercent,
    fatKg,
    snfKg,
    fatAmount: parseFloat(fatAmount.toFixed(2)),
    snfAmount: parseFloat(snfAmount.toFixed(2)),
    ratePerLiter: parseFloat(ratePerLiter.toFixed(2)),
    totalAmount,
    formula,
  };
}