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
  calculateEstimateLine,
  calculateSettlement,
  roundWeight,
  roundCurrency,
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
      expect(estimate.totals.goldPureWT).toBe(13.353);
      expect(estimate.totals.goldNetWT).toBe(17.57);
      expect(estimate.totals.diamondCarats).toBe(1.33);
      expect(estimate.totals.gstRate).toBe(3.0);
      expect(estimate.totals.grandTotal).toBeGreaterThan(0);
    });

    it('adjusts PURCHASE cost sheet balances in negative (Gold Pure WT -> Gold Balance, Remaining -> Cash Balance)', () => {
      const prevWT = 3.353;
      const prevMC = -21859.00;

      const estimate = calculateEstimateSheet({
        estimateNo: 'EST-2026-106',
        customerId: 'cust-tikvah',
        transactionType: 'PURCHASE',
        goldRate: 11845.13,
        balanceComparison: {
          ledgerOldPureWT: prevWT,
          ledgerOldAmount: prevMC,
          gSheetOldPureWT: prevWT,
          gSheetOldAmount: prevMC,
          gSheetNewPureWT: 0,
          gSheetNewAmount: 0,
          ledgerNewPureWT: 0,
          ledgerNewAmount: 0,
          pureWTDiff: 0,
          amountDiff: 0,
          isReconciled: true,
        },
        items: [
          {
            item: '18 CT GLD RIN',
            category: 'GOLD',
            grossWT: 18.476,
            stoneWT: 0.906,
            touch: 76.0,
            rate: 11845.13,
            rateUnit: 'PER_G',
          },
          {
            item: 'MC',
            category: 'MAKING_CHARGE',
            grossWT: 17.570,
            rate: 948.98,
            rateUnit: 'PER_G',
          },
        ],
      }, 3.0);

      expect(estimate.previousBalanceWT).toBe(3.353);
      expect(estimate.previousBalanceMC).toBe(-21859.00);
      // Gold pure WT is 13.353 g, adjusted negative for purchase
      expect(estimate.totals.goldPureWT).toBe(13.353);
      expect(estimate.balanceComparison.deltaPureWT).toBe(-13.353);
      expect(estimate.newBalanceWT).toBe(-10.000);
      // Cash adjustment is negative for purchase
      expect(estimate.balanceComparison.deltaAmount).toBeLessThan(0);
      expect(estimate.newBalanceMC).toBe(roundCurrency(prevMC + estimate.balanceComparison.deltaAmount!));
    });

    it('adjusts SALE cost sheet balances in positive (Gold Pure WT -> Gold Balance, Remaining -> Cash Balance)', () => {
      const prevWT = 4.328;
      const prevMC = -5263.51;

      const estimate = calculateEstimateSheet({
        estimateNo: 'EST-2026-107',
        customerId: 'cust-tikvah',
        transactionType: 'SALE',
        goldRate: 11845.13,
        balanceComparison: {
          ledgerOldPureWT: prevWT,
          ledgerOldAmount: prevMC,
          gSheetOldPureWT: prevWT,
          gSheetOldAmount: prevMC,
          gSheetNewPureWT: 0,
          gSheetNewAmount: 0,
          ledgerNewPureWT: 0,
          ledgerNewAmount: 0,
          pureWTDiff: 0,
          amountDiff: 0,
          isReconciled: true,
        },
        items: [
          {
            item: '18 CT GLD RIN',
            category: 'GOLD',
            grossWT: 7.802,
            stoneWT: 0.180,
            touch: 76.0,
            rate: 11845.13,
            rateUnit: 'PER_G',
          },
        ],
      }, 3.0);

      expect(estimate.previousBalanceWT).toBe(4.328);
      expect(estimate.previousBalanceMC).toBe(-5263.51);
      expect(estimate.balanceComparison.deltaPureWT).toBe(estimate.totals.goldPureWT);
      expect(estimate.newBalanceWT).toBe(roundWeight(prevWT + estimate.totals.goldPureWT!));
    });

    it('correctly handles Stone WT entered in Carats (ct) vs Grams (g)', () => {
      // 18 CT GLD RIN with Stone WT entered as 0.90 ct (should convert to 0.180 g)
      const line = calculateEstimateLine({
        item: '18 CT GLD RIN',
        category: 'GOLD',
        grossWT: 7.802,
        stoneWT: 0.90, // 0.90 carats
        stoneWTUnit: 'ct',
        touch: 76.0,
        rate: 11845.13,
        rateUnit: 'PER_G',
      });

      expect(line.stoneWT).toBe(0.180); // 0.90 * 0.200 = 0.180g
      expect(line.stoneWTCarats).toBe(0.90);
      expect(line.netWT).toBe(7.622); // 7.802 - 0.180 = 7.622g
      expect(line.pureWT).toBe(5.793); // 7.622 * 0.76 = 5.793g
      expect(line.amount).toBe(68618.84); // 5.793 * 11845.13 = 68618.84
    });

    it('treats Net WT as Pure WT for diamonds/stones and calculates carat amounts', () => {
      // DMD item entered with 1.330 ct at ₹70,443.61/ct
      const diamondLine = calculateEstimateLine({
        item: 'DMD',
        category: 'DIAMOND',
        grossWT: 1.330,
        stoneWT: 0.000,
        stoneWTUnit: 'ct',
        touch: 0.0,
        rate: 70443.61,
        rateUnit: 'PER_CT',
      });

      // Net WT acts as Pure WT
      expect(diamondLine.netWT).toBe(1.330);
      expect(diamondLine.pureWT).toBe(1.330);
      // Carat rate calculated accurately (1.330 * 70443.61 = 93690.00)
      expect(diamondLine.amount).toBe(93690.00);
    });

    it('calculates sub-items under a main item (e.g. 18 CT GLD RIN with Gold & Rubie sub-items)', () => {
      const line = calculateEstimateLine({
        item: '18 CT GLD RIN',
        category: 'GOLD',
        grossWT: 7.802,
        stoneWT: 0,
        touch: 76.0,
        rate: 11845.13,
        rateUnit: 'PER_G',
        subItems: [
          {
            id: 'sub-1',
            name: 'Gold (18K)',
            category: 'GOLD',
            weight: 7.622,
            unit: 'g',
            touch: 76.0,
            rate: 11845.13,
            rateUnit: 'PER_G',
            nos: 1,
            amount: 0,
          },
          {
            id: 'sub-2',
            name: 'Rubie',
            category: 'PRECIOUS_STONE',
            weight: 0.90, // 0.90 carats
            unit: 'ct',
            nos: 5,
            rate: 5000,
            rateUnit: 'PER_CT',
            amount: 0,
          },
        ],
      });

      // Stone weight in grams rolled up from Rubie sub-item (0.90 ct * 0.2 = 0.180g)
      expect(line.stoneWT).toBe(0.180);
      expect(line.subItems).toBeDefined();
      expect(line.subItems?.length).toBe(2);
      expect(line.subItems?.[0].pureWT).toBe(5.793);
      expect(line.subItems?.[0].amount).toBe(68618.84);
      expect(line.subItems?.[1].weightInCarats).toBe(0.90);
      expect(line.subItems?.[1].amount).toBe(4500.00);
      // Total line amount equals Gold (68618.84) + Rubie (4500.00) = 73118.84
      expect(line.amount).toBe(73118.84);
    });

    it('handles FIX settlement mode: 100% Cash balance adjustment with 0 Gold balance impact', () => {
      const estimate = calculateEstimateSheet({
        estimateNo: 'EST-FIX-01',
        transactionType: 'PURCHASE',
        settlementMode: 'FIX',
        goldRate: 11845.13,
        items: [
          {
            item: '18 CT GLD RIN',
            category: 'GOLD',
            grossWT: 7.802,
            stoneWT: 0.180,
            touch: 76.0,
            rate: 11845.13,
            rateUnit: 'PER_G',
          },
        ],
      }, 3.0);

      // Gold Pure WT is NOT adjusted in FIX mode
      expect(estimate.balanceComparison.deltaPureWT).toBe(0);
      // Entire Grand Total (with GST) is adjusted in Cash balance
      expect(estimate.balanceComparison.deltaAmount).toBe(-estimate.totals.grandTotal);
    });

    it('calculates UNFIX B2B_WITHOUT_MC: Gold and Gold GST in Gold, MC & Expenses in Cash', () => {
      const estimate = calculateEstimateSheet({
        estimateNo: 'EST-UNFIX-B2B1',
        transactionType: 'SALE',
        settlementMode: 'UNFIX',
        unfixPreset: 'B2B_WITHOUT_MC',
        goldRate: 10000,
        additionalExpenses: {
          huidCharges: 90,
          courierCharges: 250,
        },
        items: [
          {
            item: 'Gold Ring',
            category: 'GOLD',
            grossWT: 10.0,
            stoneWT: 0,
            touch: 100, // 10g pure gold
            rate: 10000,
            rateUnit: 'PER_G',
          },
          {
            item: 'Making Charge',
            category: 'MAKING_CHARGE',
            grossWT: 0,
            stoneWT: 0,
            touch: 0,
            rate: 5000, // ₹5000 MC
            rateUnit: 'LUMP_SUM',
            amount: 5000,
          },
        ],
      }, 3.0);

      // Gold metal value = 10g * 10,000 = 1,00,000.
      // Gold GST (3%) = 3,000.
      // Converted Gold GST in grams = 3,000 / 10,000 = 0.300 g.
      // Total Gold settled = 10.000 + 0.300 = 10.300 g.
      expect(estimate.totals.settledGoldWT).toBe(10.300);
      expect(estimate.balanceComparison.deltaPureWT).toBe(10.300);

      // Cash settled = MC (5000) + HUID (90) + Courier (250) + Non-Gold GST (3% of 5340 = 160.20)
      // 5000 + 90 + 250 + 160.20 = 5500.20
      expect(estimate.totals.settledCashAmount).toBe(5500.20);
      expect(estimate.balanceComparison.deltaAmount).toBe(5500.20);
    });

    it('calculates UNFIX B2B_WITH_MC: Gold, Gold GST, and Making Charges in Gold', () => {
      const estimate = calculateEstimateSheet({
        estimateNo: 'EST-UNFIX-B2B2',
        transactionType: 'SALE',
        settlementMode: 'UNFIX',
        unfixPreset: 'B2B_WITH_MC',
        goldRate: 10000,
        additionalExpenses: {
          courierCharges: 500,
        },
        items: [
          {
            item: 'Gold Ring',
            category: 'GOLD',
            grossWT: 10.0,
            stoneWT: 0,
            touch: 100,
            rate: 10000,
            rateUnit: 'PER_G',
          },
          {
            item: 'Making Charge',
            category: 'MAKING_CHARGE',
            grossWT: 0,
            stoneWT: 0,
            touch: 0,
            rate: 5000,
            rateUnit: 'LUMP_SUM',
            amount: 5000, // ₹5000 / 10000 = 0.500 g
          },
        ],
      }, 3.0);

      // Gold (10.000g) + Gold GST (0.300g) + MC (0.500g) = 10.800g
      expect(estimate.totals.settledGoldWT).toBe(10.800);
      expect(estimate.balanceComparison.deltaPureWT).toBe(10.800);

      // Courier (500) + Non-Gold GST (165.00) = 665.00
      expect(estimate.totals.settledCashAmount).toBe(665.00);
      expect(estimate.balanceComparison.deltaAmount).toBe(665.00);
    });

    it('calculates UNFIX ALL_IN_GOLD: All charges converted to Pure Gold weight with 0 Cash', () => {
      const estimate = calculateEstimateSheet({
        estimateNo: 'EST-UNFIX-ALLGOLD',
        transactionType: 'SALE',
        settlementMode: 'UNFIX',
        unfixPreset: 'ALL_IN_GOLD',
        goldRate: 10000,
        items: [
          {
            item: 'Gold Ring',
            category: 'GOLD',
            grossWT: 10.0,
            stoneWT: 0,
            touch: 100,
            rate: 10000,
            rateUnit: 'PER_G',
          },
          {
            item: 'Making Charge',
            category: 'MAKING_CHARGE',
            grossWT: 0,
            stoneWT: 0,
            touch: 0,
            rate: 5000,
            rateUnit: 'LUMP_SUM',
            amount: 5000,
          },
        ],
      }, 3.0);

      expect(estimate.totals.settledCashAmount).toBe(0);
      expect(estimate.balanceComparison.deltaAmount).toBe(0);
      expect(estimate.totals.settledGoldWT).toBeGreaterThan(10);
    });

    it('calculates UNFIX SPLIT Gold: pays partial gold in metal, remainder in cash', () => {
      const estimate = calculateEstimateSheet({
        estimateNo: 'EST-UNFIX-SPLIT',
        transactionType: 'SALE',
        settlementMode: 'UNFIX',
        unfixPreset: 'CUSTOM',
        unfixComponentSettlement: {
          goldMetalMode: 'SPLIT',
          goldPaidInMetalGrams: 6.0, // 6g in metal, 4g converted to cash
          goldGSTMode: 'GOLD',
          mcMode: 'CASH',
          stonesMode: 'CASH',
          expensesMode: 'CASH',
        },
        goldRate: 10000,
        items: [
          {
            item: 'Gold Bar',
            category: 'GOLD',
            grossWT: 10.0,
            stoneWT: 0,
            touch: 100, // 10g pure
            rate: 10000,
            rateUnit: 'PER_G',
          },
        ],
      }, 3.0);

      // Gold GST = 3000 / 10000 = 0.300g
      // 6.000g in metal + 0.300g GST in gold = 6.300g settled in gold
      expect(estimate.totals.settledGoldWT).toBe(6.300);
      expect(estimate.balanceComparison.deltaPureWT).toBe(6.300);

      // Remaining 4.000g gold * 10000 = ₹40,000 cash
      expect(estimate.totals.settledCashAmount).toBe(40000);
      expect(estimate.balanceComparison.deltaAmount).toBe(40000);
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
