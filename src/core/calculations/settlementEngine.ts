import { roundWeight, roundCurrency } from './mathUtils';
import { SettlementRecord } from './types';

export interface SettlementInput {
  customerId: string;
  orderId?: string;
  settlementType: 'GOLD_ONLY' | 'CASH_ONLY' | 'GOLD_AND_CASH';
  previousBalanceWT: number;
  previousBalanceMC: number;
  goldReceived: number;
  cashReceived: number;
  agreedGoldRate: number;
  notes?: string;
}

export interface SettlementResult {
  settlementRecord: SettlementRecord;
  deltaWT: number;
  deltaMC: number;
  newBalanceWT: number;
  newBalanceMC: number;
  goldEquivalentValue: number;
}

/**
 * Calculates Gold and Cash Settlement impact on running customer balances.
 */
export function calculateSettlement(input: SettlementInput): SettlementResult {
  const prevWT = Number(input.previousBalanceWT) || 0;
  const prevMC = Number(input.previousBalanceMC) || 0;
  const goldRec = Math.abs(Number(input.goldReceived) || 0);
  const cashRec = Math.abs(Number(input.cashReceived) || 0);
  const rate = Number(input.agreedGoldRate) || 0;

  let deltaWT = 0;
  let deltaMC = 0;

  switch (input.settlementType) {
    case 'GOLD_ONLY':
      // Gold received settles pure weight balance
      deltaWT = -goldRec;
      deltaMC = 0;
      break;

    case 'CASH_ONLY':
      // Cash received settles currency balance
      deltaWT = 0;
      deltaMC = -cashRec;
      break;

    case 'GOLD_AND_CASH':
      deltaWT = -goldRec;
      deltaMC = -cashRec;
      break;
  }

  const newBalanceWT = roundWeight(prevWT + deltaWT);
  const newBalanceMC = roundCurrency(prevMC + deltaMC);
  const goldEquivalentValue = roundCurrency(goldRec * rate);

  const settlementRecord: SettlementRecord = {
    id: `set-${Date.now()}`,
    settlementNo: `SET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    customerId: input.customerId,
    orderId: input.orderId,
    settlementType: input.settlementType,
    previousBalanceWT: roundWeight(prevWT),
    previousBalanceMC: roundCurrency(prevMC),
    goldReceived: roundWeight(goldRec),
    cashReceived: roundCurrency(cashRec),
    agreedGoldRate: rate,
    newBalanceWT,
    newBalanceMC,
    notes: input.notes,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  };

  return {
    settlementRecord,
    deltaWT: roundWeight(deltaWT),
    deltaMC: roundCurrency(deltaMC),
    newBalanceWT,
    newBalanceMC,
    goldEquivalentValue,
  };
}
