import { roundWeight, roundCurrency, roundPurity } from './mathUtils';
import { EstimateCostSheet, EstimateLineItem } from './types';

/**
 * Calculates a single Estimate line item's Net WT, Pure WT, and Amount.
 */
export function calculateEstimateLine(
  line: Partial<EstimateLineItem>,
  defaultGoldRate: number = 0
): EstimateLineItem {
  const grossWT = Number(line.grossWT) || 0;
  const stoneWT = Number(line.stoneWT) || 0;
  const nos = Number(line.nos) || 1;
  const touch = Number(line.touch) || 0;
  const rate = Number(line.rate) ?? defaultGoldRate;
  const rateUnit = line.rateUnit || 'PER_G';
  const category = line.category || 'GOLD';

  // Net WT = Gross - Stone
  const netWT = roundWeight(Math.max(0, grossWT - stoneWT));

  // Pure WT = Net WT * (Touch / 100)
  const pureWT = touch > 0 ? roundWeight(netWT * (touch / 100)) : 0;

  // Calculate Stone carats if stone weight is present
  const stoneWTCarats = line.stoneWTCarats ?? (stoneWT > 0 ? roundWeight(stoneWT / 0.2) : 0);

  // Line amount calculation based on category & unit
  let calculatedAmount = 0;
  switch (rateUnit) {
    case 'PER_G':
      // If gold, multiply by Pure WT if touch is applied, or Net WT
      if (category === 'GOLD' && pureWT > 0) {
        calculatedAmount = pureWT * rate;
      } else {
        calculatedAmount = (netWT > 0 ? netWT : grossWT) * rate;
      }
      break;

    case 'PER_CT':
      calculatedAmount = (stoneWTCarats > 0 ? stoneWTCarats : (stoneWT / 0.2)) * rate;
      break;

    case 'PER_PIECE':
      calculatedAmount = nos * rate;
      break;

    case 'LUMP_SUM':
      calculatedAmount = rate;
      break;

    case 'PERCENT':
      // Percentage of base metal value
      calculatedAmount = (netWT * defaultGoldRate * (rate / 100));
      break;

    default:
      calculatedAmount = (netWT > 0 ? netWT : grossWT) * rate;
  }

  const amount = roundCurrency(calculatedAmount);

  return {
    id: line.id || `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sl: line.sl || 1,
    item: line.item || 'Item',
    category,
    nos,
    grossWT: roundWeight(grossWT),
    stoneWT: roundWeight(stoneWT),
    stoneWTCarats,
    netWT,
    touch: roundPurity(touch),
    pureWT,
    rate,
    rateUnit,
    amount,
    remarks: line.remarks || '',
  };
}

/**
 * Calculates complete Estimate Sheet Totals, GST, and Balance Comparison.
 */
export function calculateEstimateSheet(
  sheet: Partial<Omit<EstimateCostSheet, 'items'>> & { items?: Partial<EstimateLineItem>[] },
  gstPercentage: number = 3.0
): EstimateCostSheet {
  const goldRate = Number(sheet.goldRate) || 0;
  const items = (sheet.items || []).map((item, idx) =>
    calculateEstimateLine({ ...item, sl: idx + 1 }, goldRate)
  );

  let goldValue = 0;
  let diamondValue = 0;
  let psValue = 0;
  let mcValue = 0;
  let otherValue = 0;

  let totalGrossWT = 0;
  let totalStoneWT = 0;
  let totalNetWT = 0;
  let totalPureWT = 0;

  for (const item of items) {
    totalGrossWT += item.grossWT;
    totalStoneWT += item.stoneWT;
    totalNetWT += item.netWT;
    totalPureWT += item.pureWT;

    switch (item.category) {
      case 'GOLD':
        goldValue += item.amount;
        break;
      case 'DIAMOND':
        diamondValue += item.amount;
        break;
      case 'PRECIOUS_STONE':
        psValue += item.amount;
        break;
      case 'MAKING_CHARGE':
        mcValue += item.amount;
        break;
      default:
        otherValue += item.amount;
    }
  }

  goldValue = roundCurrency(goldValue);
  diamondValue = roundCurrency(diamondValue);
  psValue = roundCurrency(psValue);
  mcValue = roundCurrency(mcValue);
  otherValue = roundCurrency(otherValue);

  const taxableValue = roundCurrency(goldValue + diamondValue + psValue + mcValue + otherValue);
  const gstRate = Number(gstPercentage) || 3.0;
  const gstAmount = roundCurrency(taxableValue * (gstRate / 100));
  const grandTotal = roundCurrency(taxableValue + gstAmount);

  // Balance comparisons
  const existingOldPureWT = sheet.balanceComparison?.ledgerOldPureWT ?? 0;
  const existingOldAmount = sheet.balanceComparison?.ledgerOldAmount ?? 0;

  const ledgerNewPureWT = roundWeight(existingOldPureWT + totalPureWT);
  const ledgerNewAmount = roundCurrency(existingOldAmount + grandTotal);

  const gSheetOldPureWT = sheet.balanceComparison?.gSheetOldPureWT ?? existingOldPureWT;
  const gSheetOldAmount = sheet.balanceComparison?.gSheetOldAmount ?? existingOldAmount;
  const gSheetNewPureWT = sheet.balanceComparison?.gSheetNewPureWT ?? ledgerNewPureWT;
  const gSheetNewAmount = sheet.balanceComparison?.gSheetNewAmount ?? ledgerNewAmount;

  const pureWTDiff = roundWeight(Math.abs(gSheetNewPureWT - ledgerNewPureWT));
  const amountDiff = roundCurrency(Math.abs(gSheetNewAmount - ledgerNewAmount));
  const isReconciled = pureWTDiff <= 0.001 && amountDiff <= 1.0;

  return {
    id: sheet.id || `est-${Date.now()}`,
    estimateNo: sheet.estimateNo || `EST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    estimateDate: sheet.estimateDate || new Date().toISOString().split('T')[0],
    customerId: sheet.customerId || '',
    customerName: sheet.customerName || '',
    orderId: sheet.orderId,
    orderRef: sheet.orderRef,
    customerRef: sheet.customerRef,
    touchFixed: sheet.touchFixed ?? true,
    isGold: sheet.isGold ?? true,
    goldRate,
    goldRatePurity: sheet.goldRatePurity || 99.5,
    unfixGoldRate: sheet.unfixGoldRate,
    unfixGoldRatePurity: sheet.unfixGoldRatePurity,
    remarks: sheet.remarks || '',
    items,
    totals: {
      goldValue,
      diamondValue,
      psValue,
      mcValue,
      taxableValue,
      gstRate,
      gstAmount,
      grandTotal,
      totalGrossWT: roundWeight(totalGrossWT),
      totalStoneWT: roundWeight(totalStoneWT),
      totalNetWT: roundWeight(totalNetWT),
      totalPureWT: roundWeight(totalPureWT),
    },
    balanceComparison: {
      gSheetOldPureWT: roundWeight(gSheetOldPureWT),
      gSheetOldAmount: roundCurrency(gSheetOldAmount),
      gSheetNewPureWT: roundWeight(gSheetNewPureWT),
      gSheetNewAmount: roundCurrency(gSheetNewAmount),
      ledgerOldPureWT: roundWeight(existingOldPureWT),
      ledgerOldAmount: roundCurrency(existingOldAmount),
      ledgerNewPureWT,
      ledgerNewAmount,
      pureWTDiff,
      amountDiff,
      isReconciled,
    },
    status: sheet.status || 'DRAFT',
    createdAt: sheet.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
