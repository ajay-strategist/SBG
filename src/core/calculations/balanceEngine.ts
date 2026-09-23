import { roundWeight, roundCurrency } from './mathUtils';
import { LedgerTransaction } from './types';

/**
 * Calculates running balances for a sequential list of ledger transactions.
 * Balance WT = Previous Balance WT + Transaction Pure WT
 * Balance MC = Previous Balance MC + Transaction Total Amount
 */
export function calculateRunningBalances(
  transactions: LedgerTransaction[],
  openingWT: number = 0,
  openingMC: number = 0
): LedgerTransaction[] {
  let currentWT = Number(openingWT) || 0;
  let currentMC = Number(openingMC) || 0;

  return transactions.map((tx) => {
    currentWT = roundWeight(currentWT + (Number(tx.pureWT) || 0));
    currentMC = roundCurrency(currentMC + (Number(tx.totalAmount) || 0));

    return {
      ...tx,
      balanceWT: currentWT,
      balanceMC: currentMC,
    };
  });
}

/**
 * Calculates final aggregated customer balance from transactions and opening balance.
 */
export function calculateCustomerSummaryBalances(
  transactions: LedgerTransaction[],
  openingWT: number = 0,
  openingMC: number = 0
): { currentWT: number; currentMC: number } {
  const recalculated = calculateRunningBalances(transactions, openingWT, openingMC);
  if (recalculated.length === 0) {
    return {
      currentWT: roundWeight(openingWT),
      currentMC: roundCurrency(openingMC),
    };
  }
  const last = recalculated[recalculated.length - 1];
  return {
    currentWT: last.balanceWT,
    currentMC: last.balanceMC,
  };
}
