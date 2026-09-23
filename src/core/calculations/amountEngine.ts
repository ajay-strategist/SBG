import { roundCurrency } from './mathUtils';
import { RateUnit, TransactionDirection } from './types';
import { getDirectionMultiplier } from './weightEngine';

/**
 * Calculates Stone Amount based on Rate and Rate Unit:
 * - PER_CT: Rate * Carats
 * - PER_G: Rate * Grams
 * - PER_PIECE / LUMP_SUM: Rate * (Nos or 1)
 */
export function calculateStoneAmount(
  quantityOrWeight: number,
  rate: number,
  unit: RateUnit = 'PER_CT',
  direction: TransactionDirection = 'ISSUE'
): number {
  const qty = Math.abs(Number(quantityOrWeight) || 0);
  const r = Number(rate) || 0;
  const base = qty * r;
  const multiplier = getDirectionMultiplier(direction);
  return roundCurrency(base * multiplier);
}

/**
 * Calculates Making Charge (MC) Amount:
 * - PER_G: MC Rate * Net WT (magnitude)
 * - PER_PIECE: MC Rate * Nos
 * - LUMP_SUM: MC Rate
 */
export function calculateMCAmount(
  weightOrNos: number,
  mcRate: number,
  unit: RateUnit = 'PER_G',
  direction: TransactionDirection = 'ISSUE'
): number {
  const baseQty = Math.abs(Number(weightOrNos) || 0);
  const rate = Number(mcRate) || 0;
  const rawMC = baseQty * rate;
  const multiplier = getDirectionMultiplier(direction);
  return roundCurrency(rawMC * multiplier);
}

/**
 * Calculates Total Calculated Amount for a transaction:
 * Total Amount = Stone Amount Cal + MC Amount Cal
 */
export function calculateTotalAmount(stoneAmountCal: number, mcAmountCal: number): number {
  const stone = Number(stoneAmountCal) || 0;
  const mc = Number(mcAmountCal) || 0;
  return roundCurrency(stone + mc);
}
