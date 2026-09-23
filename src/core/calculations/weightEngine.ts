import { roundWeight } from './mathUtils';
import { TransactionDirection } from './types';

/**
 * Standard Metric Carat to Gram Conversion:
 * 1 Carat (ct) = 0.200 Grams (g)
 */
export function stoneCaratsToGrams(carats: number): number {
  if (!carats || carats <= 0) return 0;
  return roundWeight(carats * 0.2);
}

/**
 * Grams to Carats Conversion:
 * 1 Gram (g) = 5.000 Carats (ct)
 */
export function stoneGramsToCarats(grams: number): number {
  if (!grams || grams <= 0) return 0;
  return roundWeight(grams / 0.2);
}

/**
 * Direction Multiplier:
 * ISSUE   -> +1 (Gold / Goods issued out to client or workshop)
 * RECEIPT -> -1 (Gold / Goods received in from client or purchase)
 */
export function getDirectionMultiplier(direction: TransactionDirection): number {
  return direction === 'RECEIPT' ? -1 : 1;
}

/**
 * Calculates Net Weight with direction applied:
 * Net WT Magnitude = Gross WT - Stone WT (in grams)
 * Net WT = Direction Multiplier * Net WT Magnitude
 *
 * Example:
 * RECEIPT, Gross: 18.476, Stone: 0.906 -> -(18.476 - 0.906) = -17.570 g
 */
export function calculateNetWT(
  grossWT: number,
  stoneWTGrams: number,
  direction: TransactionDirection = 'ISSUE'
): number {
  const gross = Number(grossWT) || 0;
  const stone = Number(stoneWTGrams) || 0;
  const magnitude = Math.max(0, gross - stone);
  const multiplier = getDirectionMultiplier(direction);
  return roundWeight(magnitude * multiplier);
}
