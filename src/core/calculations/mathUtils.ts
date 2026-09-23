/**
 * High-precision mathematical rounding utilities for jewellery financial calculations.
 * Avoids floating-point drift (e.g. 0.1 + 0.2 !== 0.3).
 */

export function round(value: number, decimals: number = 2): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Standard 3-decimal precision for Gold / Silver weights (grams).
 */
export function roundWeight(val: number): number {
  return round(val, 3);
}

/**
 * Standard 2-decimal precision for Currency / Indian Rupees (₹).
 */
export function roundCurrency(val: number): number {
  return round(val, 2);
}

/**
 * Standard 3-decimal precision for Gemstones & Diamonds (carats).
 */
export function roundCarat(val: number): number {
  return round(val, 3);
}

/**
 * Standard 2-decimal precision for Touch / Purity percentages (e.g. 76.00%).
 */
export function roundPurity(val: number): number {
  return round(val, 2);
}
