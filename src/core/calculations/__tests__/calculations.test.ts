import { describe, it, expect } from 'vitest';
import {
  stoneCaratsToGrams,
  stoneGramsToCarats,
  calculateNetWT,
  calculatePureWT,
  calculateTouch,
  calculateStoneAmount,
  calculateMCAmount,
  calculateTotalAmount,
  calculateRunningBalances,
  calculateEstimateSheet,
  calculateSettlement,
  LedgerTransaction,
} from '../index';

describe('SBG Core Calculation Engine', () => {
  describe('Weight & Conversion Engine', () => {
    it('converts carats to grams correctly (1 ct = 0.200 g)', () => {
      expect(stoneCaratsToGrams(5)).toBe(1.0);
      expect(stoneCaratsToGrams(1.33)).toBe(0.266);
      expect(stoneCaratsToGrams(4.53)).toBe(0.906);
    });

    it('converts grams to carats correctly (1 g = 5.000 ct)', () => {
      expect(stoneGramsToCarats(1.0)).toBe(5.0);
      expect(stoneGramsToCarats(0.906)).toBe(4.53);
    });

    it('calculates Net WT with ISSUE (positive) direction', () => {
      const net = calculateNetWT(20.5, 0.5, 'ISSUE');
      expect(net).toBe(20.0);
    });

    it('calculates Net WT with RECEIPT (negative) direction', () => {
      const net = calculateNetWT(18.476, 0.906, 'RECEIPT');
      expect(net).toBe(-17.57);
    });
  });

  describe('Critical Specification Test Case (Sample Transaction)', () => {
    it('reproduces exact sample transaction: RECEIPT PURCHASE, Gross: 18.476, Stone: 0.906, Touch: 76% -> Net: -17.570, Pure: -13.353', () => {
      const grossWT = 18.476;
      const stoneWT = 0.906;
      const direction = 'RECEIPT';
      const touch = 76; // 76%

      // 1. Net WT Calculation
      const netWT = calculateNetWT(grossWT, stoneWT, direction);
      expect(netWT).toBe(-17.57);

      // 2. Pure WT Calculation
      const pureWT = calculatePureWT(netWT, touch);
      // -17.570 * 0.76 = -13.3532 -> rounded to -13.353
      expect(pureWT).toBe(-13.353);
    });
  });

  describe('Amount & Balance Engine', () => {
    it('computes Stone Amount and MC Amount accurately', () => {
      const stoneAmount = calculateStoneAmount(1.33, 70443.61, 'PER_CT', 'ISSUE');
      expect(stoneAmount).toBe(93690.0);

      const mcAmount = calculateMCAmount(17.57, 948.98, 'PER_G', 'ISSUE');
      expect(mcAmount).toBe(16673.58);

      const total = calculateTotalAmount(stoneAmount, mcAmount);
      expect(total).toBe(110363.58);
    });

    it('computes running ledger balances sequentially from opening balance', () => {
      const tx1: LedgerTransaction = {
        id: 'tx1',
        customerId: 'cust1',
        date: '2026-09-01',
        direction: 'ISSUE',
        particulars: 'ISSUE',
        description: 'Gold Issued to Karigar',
        nos: 1,
        grossWT: 50.0,
        stoneWT: 0,
        netWT: 50.0,
        touch: 91.6,
        pureWT: 45.8,
        stoneAmount: 0,
        stoneAmountCal: 0,
        mcAmount: 5000,
        mcAmountCal: 5000,
        totalAmount: 5000,
        balanceWT: 0,
        balanceMC: 0,
        status: 'CONFIRMED',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      };

      const tx2: LedgerTransaction = {
        id: 'tx2',
        customerId: 'cust1',
        date: '2026-09-02',
        direction: 'RECEIPT',
        particulars: 'PURCHASE',
        description: 'Finished Jewellery Received',
        nos: 22,
        grossWT: 18.476,
        stoneWT: 0.906,
        netWT: -17.57,
        touch: 76.0,
        pureWT: -13.353,
        stoneAmount: 0,
        stoneAmountCal: 0,
        mcAmount: -2500,
        mcAmountCal: -2500,
        totalAmount: -2500,
        balanceWT: 0,
        balanceMC: 0,
        status: 'CONFIRMED',
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T10:00:00Z',
      };

      const openingWT = 10.0;
      const openingMC = 20000;

      const balances = calculateRunningBalances([tx1, tx2], openingWT, openingMC);

      expect(balances[0].balanceWT).toBe(55.8); // 10.0 + 45.8
      expect(balances[0].balanceMC).toBe(25000); // 20000 + 5000

      expect(balances[1].balanceWT).toBe(42.447); // 55.8 - 13.353
      expect(balances[1].balanceMC).toBe(22500); // 25000 - 2500
    });
  });

  describe('Estimate / Cost Sheet Engine', () => {
    it('calculates multi-item estimate with GST and taxable values', () => {
      const estimate = calculateEstimateSheet({
        estimateNo: 'EST-2026-001',
        customerId: 'cust1',
        goldRate: 11845.13,
        items: [
          {
            item: '18ct Gold Ornament',
            category: 'GOLD',
            grossWT: 18.476,
            stoneWT: 0.906,
            touch: 76.0,
            rate: 11845.13,
            rateUnit: 'PER_G',
          },
          {
            item: 'VVS Diamond',
            category: 'DIAMOND',
            grossWT: 0.266,
            stoneWT: 0.266,
            stoneWTCarats: 1.33,
            rate: 70443.61,
            rateUnit: 'PER_CT',
          },
        ],
      }, 3.0);

      expect(estimate.totals.totalNetWT).toBe(17.57);
      expect(estimate.totals.totalPureWT).toBe(13.353);
      expect(estimate.totals.gstRate).toBe(3.0);
      expect(estimate.totals.grandTotal).toBeGreaterThan(0);
    });
  });

  describe('Settlement Engine', () => {
    it('calculates Gold and Cash Settlement balance adjustment', () => {
      const result = calculateSettlement({
        customerId: 'cust1',
        settlementType: 'GOLD_AND_CASH',
        previousBalanceWT: 50.0,
        previousBalanceMC: 100000,
        goldReceived: 20.0,
        cashReceived: 60000,
        agreedGoldRate: 8500,
      });

      expect(result.newBalanceWT).toBe(30.0); // 50 - 20
      expect(result.newBalanceMC).toBe(40000); // 100,000 - 60,000
      expect(result.goldEquivalentValue).toBe(170000); // 20 * 8500
    });
  });
});
