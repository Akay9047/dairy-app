/**
 * Rajasthan Dairy Rate Calculator
 * Based on Saras/RCDF Two-Axis Pricing Policy
 * 
 * Standard Formula (used by Saras Jaipur, private dairies):
 * SNF auto = 0.7 × Fat% + 0.05 × CLR (approx) — simplified: SNF = Fat × 0.7 + 4.2
 * Rate/Liter = (Fat%/100 × fatRatePerKg) + (SNF%/100 × snfRatePerKg)
 * Total = Rate/Liter × Liters
 * 
 * Saras 2025 rates: ₹8/fat% = ₹800/kg fat
 * SNF rate = 2/3 of fat rate = ~₹533/kg SNF
 * Private dairies: Fat ₹600-900/kg, SNF ₹400-600/kg
 */

export interface RateConfig {
  fatRatePerKg: number;   // ₹ per KG of fat (e.g. 800)
  snfRatePerKg: number;   // ₹ per KG of SNF (e.g. 533)
  minRatePerLiter: number; // minimum guaranteed ₹/liter (e.g. 40)
  useMinRate: boolean;
  milkType: "cow" | "buffalo" | "mixed";
}

export const DEFAULT_RATE_CONFIG: RateConfig = {
  fatRatePerKg: 800,      // ₹800/kg fat (Rajasthan standard 2025)
  snfRatePerKg: 533,      // ₹533/kg SNF (2/3 of fat rate)
  minRatePerLiter: 40,    // min ₹40/liter
  useMinRate: true,
  milkType: "mixed",
};

// Standard SNF estimation from Fat% (Rajasthan cooperative formula)
export function estimateSNF(fatPercent: number, milkType: "cow" | "buffalo" | "mixed" = "mixed"): number {
  // Based on IS:1479 and NDDB guidelines
  // Buffalo milk: SNF ≈ 9.0% minimum, higher fat → slightly lower SNF
  // Cow milk: SNF ≈ 8.5% minimum
  // Formula: SNF = Total Solids - Fat, TS ≈ 0.25×Fat + 10.95 (Rajasthan avg)
  let snf: number;
  switch (milkType) {
    case "buffalo":
      snf = 0.21 * fatPercent + 8.5; // Buffalo: higher base SNF
      break;
    case "cow":
      snf = 0.21 * fatPercent + 7.8; // Cow: lower base SNF
      break;
    default:
      snf = 0.21 * fatPercent + 8.2; // Mixed: average
  }
  return parseFloat(Math.min(Math.max(snf, 7.5), 10.5).toFixed(2));
}

export function calculateRates(
  liters: number,
  fatPercent: number,
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
  const snfPercent = estimateSNF(fatPercent, config.milkType);

  // Convert % to kg per liter
  const fatKg = parseFloat(((fatPercent / 100) * liters).toFixed(4));
  const snfKg = parseFloat(((snfPercent / 100) * liters).toFixed(4));

  // Amount from each component
  const fatAmount = parseFloat((fatKg * config.fatRatePerKg).toFixed(2));
  const snfAmount = parseFloat((snfKg * config.snfRatePerKg).toFixed(2));

  // Rate per liter
  let ratePerLiter = parseFloat(((fatAmount + snfAmount) / liters).toFixed(2));

  // Apply minimum rate guarantee
  if (config.useMinRate && ratePerLiter < config.minRatePerLiter) {
    ratePerLiter = config.minRatePerLiter;
  }

  const totalAmount = parseFloat((ratePerLiter * liters).toFixed(2));

  return { snfPercent, fatKg, snfKg, fatAmount, snfAmount, ratePerLiter, totalAmount };
}

// Example: 6% fat, 5L, ₹800/kg fat, ₹533/kg SNF
// SNF = 0.21*6 + 8.2 = 9.46%
// fatKg = 0.06 * 5 = 0.3kg → ₹240
// snfKg = 0.0946 * 5 = 0.473kg → ₹252
// rate/L = (240+252)/5 = ₹98.4/L
// Total = 98.4 * 5 = ₹492
