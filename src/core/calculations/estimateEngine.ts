import { roundWeight, roundCurrency, roundPurity } from './mathUtils';
import { EstimateCostSheet, EstimateLineItem, EstimateSubItem, TransactionDirection } from './types';

/**
 * Calculates a single Estimate sub-item (e.g. Gold, Rubie, Diamond, Emerald, Making Charges).
 */
export function calculateEstimateSubItem(
  sub: Partial<EstimateSubItem>,
  defaultGoldRate: number = 0
): EstimateSubItem {
  const category = sub.category || 'PRECIOUS_STONE';
  const unit: 'g' | 'ct' = sub.unit === 'ct' ? 'ct' : 'g';
  const weightInput = Number(sub.weight) || 0;
  const nos = Number(sub.nos) || 1;
  const touch = Number(sub.touch) || 0;
  const rate = Number(sub.rate) || 0;
  const rateUnit = sub.rateUnit || (unit === 'ct' ? 'PER_CT' : 'PER_G');

  let weightInGrams = 0;
  let weightInCarats = 0;

  if (unit === 'ct') {
    weightInCarats = weightInput;
    weightInGrams = roundWeight(weightInput * 0.2); // 1 ct = 0.200 g
  } else {
    weightInGrams = roundWeight(weightInput);
    weightInCarats = roundWeight(weightInput / 0.2); // 1 g = 5.000 ct
  }

  // Pure WT: For gold with touch, weightInGrams * (touch / 100).
  // For non-metal or touch 0, Net WT as Pure WT rule applies.
  const pureWT = (category === 'GOLD' && touch > 0)
    ? roundWeight(weightInGrams * (touch / 100))
    : (touch > 0 ? roundWeight(weightInGrams * (touch / 100)) : weightInGrams);

  let calculatedAmount = 0;
  switch (rateUnit) {
    case 'PER_G':
      if (category === 'GOLD' && touch > 0 && pureWT > 0) {
        calculatedAmount = pureWT * rate;
      } else {
        calculatedAmount = weightInGrams * rate;
      }
      break;

    case 'PER_CT':
      calculatedAmount = weightInCarats * rate;
      break;

    case 'PER_PIECE':
      calculatedAmount = nos * rate;
      break;

    case 'LUMP_SUM':
      calculatedAmount = rate;
      break;

    case 'PERCENT':
      calculatedAmount = (weightInGrams * defaultGoldRate) * (rate / 100);
      break;

    default:
      calculatedAmount = (unit === 'ct' ? weightInCarats : weightInGrams) * rate;
  }

  return {
    id: sub.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: sub.name || 'Component',
    category,
    nos,
    weight: weightInput,
    unit,
    weightInGrams,
    weightInCarats,
    touch: roundPurity(touch),
    pureWT,
    rate,
    rateUnit,
    amount: roundCurrency(calculatedAmount),
    remarks: sub.remarks || '',
  };
}

/**
 * Calculates a single Estimate line item's Net WT, Pure WT, and Amount, including sub-items if present.
 */
export function calculateEstimateLine(
  line: Partial<EstimateLineItem>,
  defaultGoldRate: number = 0
): EstimateLineItem {
  const grossWT = Number(line.grossWT) || 0;
  let stoneWTInput = Number(line.stoneWT) || 0;
  let stoneWTUnit: 'g' | 'ct' = line.stoneWTUnit === 'ct' ? 'ct' : 'g';
  const nos = Number(line.nos) || 1;
  const touch = Number(line.touch) || 0;
  const rate = Number(line.rate) ?? defaultGoldRate;
  const rateUnit = line.rateUnit || 'PER_G';
  const category = line.category || 'GOLD';

  // Process sub-items if present
  let calculatedSubItems: EstimateSubItem[] | undefined = undefined;
  let subItemsTotalAmount = 0;
  let hasGoldSubItem = false;

  if (line.subItems && line.subItems.length > 0) {
    calculatedSubItems = line.subItems.map((s) => calculateEstimateSubItem(s, defaultGoldRate));
    subItemsTotalAmount = calculatedSubItems.reduce((sum, s) => sum + s.amount, 0);
    hasGoldSubItem = calculatedSubItems.some((s) => s.category === 'GOLD');

    // If stone weight wasn't explicitly entered on the parent, sum up stone sub-items
    const stoneSubs = calculatedSubItems.filter(
      (s) => s.category === 'PRECIOUS_STONE' || s.category === 'DIAMOND'
    );
    if (stoneWTInput === 0 && stoneSubs.length > 0) {
      const totalStoneGrams = stoneSubs.reduce((sum, s) => sum + (s.weightInGrams || 0), 0);
      stoneWTInput = roundWeight(totalStoneGrams);
      stoneWTUnit = 'g';
    }
  }

  // Normalize Stone WT into grams and carats
  let stoneWTInGrams = 0;
  let stoneWTCarats = 0;

  if (stoneWTUnit === 'ct') {
    stoneWTCarats = stoneWTInput;
    stoneWTInGrams = roundWeight(stoneWTInput * 0.2); // 1 ct = 0.200 g
  } else {
    stoneWTInGrams = roundWeight(stoneWTInput);
    stoneWTCarats = roundWeight(stoneWTInput / 0.2); // 1 g = 5.000 ct
  }

  // Net WT = Gross - Stone WT in Grams
  const netWT = roundWeight(Math.max(0, grossWT - stoneWTInGrams));

  // Pure WT: For gold with touch, compute Net WT * Touch%.
  // For other items (or when touch is 0), Net WT is treated as Pure WT to finalize calculation.
  const pureWT = (touch > 0 && category === 'GOLD')
    ? roundWeight(netWT * (touch / 100))
    : (touch > 0 ? roundWeight(netWT * (touch / 100)) : netWT);

  // Line amount calculation based on category & unit
  let calculatedAmount = 0;
  switch (rateUnit) {
    case 'PER_G':
      // If gold with touch, multiply by Pure WT if touch is applied, else Net WT
      if (category === 'GOLD' && touch > 0 && pureWT > 0) {
        calculatedAmount = pureWT * rate;
      } else {
        calculatedAmount = (netWT > 0 ? netWT : grossWT) * rate;
      }
      break;

    case 'PER_CT': {
      // Determine effective carats:
      let effectiveCarats = 0;
      if (line.stoneWTCarats && line.stoneWTCarats > 0) {
        effectiveCarats = line.stoneWTCarats;
      } else if (stoneWTCarats > 0) {
        effectiveCarats = stoneWTCarats;
      } else if (category === 'DIAMOND' || category === 'PRECIOUS_STONE' || rateUnit === 'PER_CT') {
        const baseWT = netWT > 0 ? netWT : grossWT;
        effectiveCarats = stoneWTUnit === 'ct' ? baseWT : roundWeight(baseWT / 0.2);
      }
      calculatedAmount = effectiveCarats * rate;
      break;
    }

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

  // If sub-items exist:
  // If sub-items include a GOLD component, sub-items represent complete composition
  // Else, sub-items (e.g. Rubie, Diamond, Making Charges) are added to the parent metal amount
  if (calculatedSubItems && calculatedSubItems.length > 0) {
    if (hasGoldSubItem) {
      calculatedAmount = subItemsTotalAmount;
    } else {
      calculatedAmount += subItemsTotalAmount;
    }
  }

  const amount = roundCurrency(calculatedAmount);

  return {
    id: line.id || `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sl: line.sl || 1,
    item: line.item || 'Item',
    category,
    nos,
    grossWT: roundWeight(grossWT),
    stoneWT: stoneWTInGrams,
    stoneWTUnit,
    stoneWTCarats,
    netWT,
    touch: roundPurity(touch),
    pureWT,
    rate,
    rateUnit,
    amount,
    remarks: line.remarks || '',
    subItems: calculatedSubItems,
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

  let goldGrossWT = 0;
  let goldStoneWT = 0;
  let goldNetWT = 0;
  let goldPureWT = 0;

  let diamondGrossWT = 0;
  let diamondStoneWT = 0;
  let diamondCarats = 0;
  let diamondPureWT = 0;

  let psGrossWT = 0;
  let psStoneWT = 0;
  let psCarats = 0;
  let psPureWT = 0;

  let otherGrossWT = 0;
  let otherStoneWT = 0;
  let otherNetWT = 0;
  let otherPureWT = 0;

  for (const item of items) {
    totalGrossWT += item.grossWT;
    totalStoneWT += item.stoneWT;
    totalNetWT += item.netWT;
    totalPureWT += item.pureWT;

    if (item.subItems && item.subItems.length > 0) {
      let subItemsTotalAmount = 0;
      let hasGoldSub = false;

      for (const sub of item.subItems) {
        subItemsTotalAmount += sub.amount;
        const sCat = String(sub.category || '').toUpperCase().replace(/[\s-]+/g, '_').trim();
        if (sCat === 'GOLD' || sCat.includes('GOLD') || sCat === 'GLD') {
          hasGoldSub = true;
          goldValue += sub.amount;
          goldPureWT += (sub.pureWT || 0);
          goldNetWT += (sub.weightInGrams || 0);
          goldGrossWT += (sub.weightInGrams || 0);
        } else if (sCat === 'DIAMOND' || sCat.includes('DIAMOND') || sCat === 'DMD') {
          diamondValue += sub.amount;
          diamondCarats += (sub.weightInCarats || 0);
          diamondStoneWT += (sub.weightInGrams || 0);
          diamondPureWT += (sub.pureWT || 0);
        } else if (sCat === 'PRECIOUS_STONE' || sCat.includes('PRECIOUS') || sCat.includes('STONE') || sCat === 'PS') {
          psValue += sub.amount;
          psCarats += (sub.weightInCarats || 0);
          psStoneWT += (sub.weightInGrams || 0);
          psPureWT += (sub.pureWT || 0);
        } else if (sCat === 'MAKING_CHARGE' || sCat.includes('MAKING') || sCat === 'MC') {
          mcValue += sub.amount;
        } else {
          otherValue += sub.amount;
        }
      }

      // If no explicit GOLD sub-item, the parent line accounts for the gold metal portion
      if (!hasGoldSub) {
        const baseMetalAmount = Math.max(0, item.amount - subItemsTotalAmount);
        goldValue += baseMetalAmount;
        goldGrossWT += item.grossWT;
        goldStoneWT += item.stoneWT;
        goldNetWT += item.netWT;
        goldPureWT += item.pureWT;
      }
    } else {
      const cat = String(item.category || '').toUpperCase().replace(/[\s-]+/g, '_').trim();
      if (cat === 'GOLD' || cat.includes('GOLD') || cat === 'GLD') {
        goldValue += item.amount;
        goldGrossWT += item.grossWT;
        goldStoneWT += item.stoneWT;
        goldNetWT += item.netWT;
        goldPureWT += item.pureWT;
      } else if (cat === 'DIAMOND' || cat.includes('DIAMOND') || cat === 'DMD') {
        diamondValue += item.amount;
        diamondGrossWT += item.grossWT;
        const dStoneWT = item.stoneWT > 0 ? item.stoneWT : item.grossWT;
        diamondStoneWT += dStoneWT;
        const dCarats = item.stoneWTCarats || (item.rateUnit === 'PER_CT' ? (item.stoneWTCarats || item.grossWT) : roundWeight(dStoneWT / 0.2));
        diamondCarats += dCarats;
        diamondPureWT += item.pureWT;
      } else if (cat === 'PRECIOUS_STONE' || cat.includes('PRECIOUS') || cat.includes('STONE') || cat === 'PS') {
        psValue += item.amount;
        psGrossWT += item.grossWT;
        const pStoneWT = item.stoneWT > 0 ? item.stoneWT : item.grossWT;
        psStoneWT += pStoneWT;
        const pCarats = item.stoneWTCarats || roundWeight(pStoneWT / 0.2);
        psCarats += pCarats;
        psPureWT += item.pureWT;
      } else if (cat === 'MAKING_CHARGE' || cat.includes('MAKING') || cat === 'MC') {
        mcValue += item.amount;
      } else {
        // If category wasn't explicit, check touch or item description
        if (item.touch > 0 || (item.item && /gold|gld|kt|ct/i.test(item.item))) {
          goldValue += item.amount;
          goldGrossWT += item.grossWT;
          goldStoneWT += item.stoneWT;
          goldNetWT += item.netWT;
          goldPureWT += item.pureWT;
        } else {
          otherValue += item.amount;
          otherGrossWT += item.grossWT;
          otherStoneWT += item.stoneWT;
          otherNetWT += item.netWT;
          otherPureWT += item.pureWT;
        }
      }
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

  // Remaining non-metal cash charges: Making charges, Diamonds, Gemstones, and associated GST
  const remainingCashValue = roundCurrency(Math.max(0, grandTotal - goldValue));

  // Transaction direction and settlement resolution
  const transactionType = sheet.transactionType || (sheet.direction === 'ISSUE' ? 'SALE' : 'PURCHASE');
  const direction: TransactionDirection = sheet.direction || (transactionType === 'PURCHASE' ? 'RECEIPT' : 'ISSUE');
  const sign = direction === 'RECEIPT' ? -1 : 1;
  const rawMode = sheet.settlementMode || (sheet.isGold !== false ? 'UNFIX' : 'FIX');
  const settlementMode = (rawMode === 'CASH_ONLY' || rawMode === 'FIX')
    ? 'FIX'
    : (rawMode === 'GOLD_ONLY' ? 'GOLD_ONLY' : 'UNFIX');

  let deltaPureWT = 0;
  let deltaAmount = 0;

  if (settlementMode === 'FIX') {
    // FIX: 100% Cash Settlement (Gold Balance = 0, Grand Total + All GST adjusted in Cash)
    deltaPureWT = 0;
    deltaAmount = roundCurrency(sign * grandTotal);
  } else if (settlementMode === 'UNFIX') {
    // UNFIX: Gold portion settled as Pure Gold WT, Remaining (Diamonds + Stones + MC + GST) in Cash
    const goldPureToAdjust = goldPureWT > 0 ? goldPureWT : totalPureWT;
    deltaPureWT = roundWeight(sign * goldPureToAdjust);
    deltaAmount = roundCurrency(sign * remainingCashValue);
  } else if (settlementMode === 'GOLD_ONLY') {
    // Settle all in pure gold weight equivalent
    deltaPureWT = roundWeight(sign * totalPureWT);
    deltaAmount = 0;
  }

  // Balance comparisons
  const existingOldPureWT = sheet.balanceComparison?.ledgerOldPureWT ?? sheet.previousBalanceWT ?? 0;
  const existingOldAmount = sheet.balanceComparison?.ledgerOldAmount ?? sheet.previousBalanceMC ?? 0;

  const ledgerNewPureWT = roundWeight(existingOldPureWT + deltaPureWT);
  const ledgerNewAmount = roundCurrency(existingOldAmount + deltaAmount);

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
    transactionType,
    direction,
    settlementMode,
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
      remainingCashValue,
      totalGrossWT: roundWeight(totalGrossWT),
      totalStoneWT: roundWeight(totalStoneWT),
      totalNetWT: roundWeight(totalNetWT),
      totalPureWT: roundWeight(totalPureWT),
      goldGrossWT: roundWeight(goldGrossWT),
      goldStoneWT: roundWeight(goldStoneWT),
      goldNetWT: roundWeight(goldNetWT),
      goldPureWT: roundWeight(goldPureWT),
      diamondGrossWT: roundWeight(diamondGrossWT),
      diamondStoneWT: roundWeight(diamondStoneWT),
      diamondCarats: roundWeight(diamondCarats),
      diamondPureWT: roundWeight(diamondPureWT),
      psGrossWT: roundWeight(psGrossWT),
      psStoneWT: roundWeight(psStoneWT),
      psCarats: roundWeight(psCarats),
      psPureWT: roundWeight(psPureWT),
      otherGrossWT: roundWeight(otherGrossWT),
      otherStoneWT: roundWeight(otherStoneWT),
      otherNetWT: roundWeight(otherNetWT),
      otherPureWT: roundWeight(otherPureWT),
    },
    previousBalanceWT: sheet.previousBalanceWT ?? roundWeight(existingOldPureWT),
    previousBalanceMC: sheet.previousBalanceMC ?? roundCurrency(existingOldAmount),
    newBalanceWT: sheet.newBalanceWT ?? ledgerNewPureWT,
    newBalanceMC: sheet.newBalanceMC ?? ledgerNewAmount,
    balanceComparison: {
      gSheetOldPureWT: roundWeight(gSheetOldPureWT),
      gSheetOldAmount: roundCurrency(gSheetOldAmount),
      gSheetNewPureWT: roundWeight(gSheetNewPureWT),
      gSheetNewAmount: roundCurrency(gSheetNewAmount),
      ledgerOldPureWT: roundWeight(existingOldPureWT),
      ledgerOldAmount: roundCurrency(existingOldAmount),
      ledgerNewPureWT,
      ledgerNewAmount,
      deltaPureWT,
      deltaAmount,
      pureWTDiff,
      amountDiff,
      isReconciled,
    },
    status: sheet.status || 'DRAFT',
    createdAt: sheet.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
