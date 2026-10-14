import React, { useState, useEffect } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  SBGCard,
  SBGButton,
  SBGInput,
  SBGSelect,
  SBGBadge,
  SBGCurrency,
  SBGWeight,
} from '../components/ui';
import {
  calculateEstimateSheet,
  roundWeight,
  formatDateDDMMYYYY,
  numberToIndianWords,
  EstimateCostSheet,
  EstimateLineItem,
  EstimateSubItem,
  EstimateItemCategory,
  RateUnit,
  UnfixPresetType,
  UnfixComponentSettlement,
  AdditionalExpenses,
} from '../core/calculations';
import {
  FileSpreadsheet,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Save,
  AlertTriangle,
  Sparkles,
  Calculator,
  Scale,
  FileCheck,
  Gem,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Layers,
  Coins,
  Truck,
  ShieldCheck,
  Sliders,
  RotateCcw,
  X,
  Wrench,
  CheckCircle2,
  Pencil,
  BookOpen,
  Building2,
  Settings,
  FileText,
  Printer,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface NewEstimateViewProps {
  preselectedCustomerId?: string;
  targetId?: string;
  isEditMode?: boolean;
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const NewEstimateView: React.FC<NewEstimateViewProps> = ({
  preselectedCustomerId,
  targetId,
  isEditMode,
  onNavigate,
}) => {
  const {
    customers,
    orders,
    estimates,
    goldMarketRate,
    defaultGSTRate,
    addEstimate,
    updateEstimate,
    confirmEstimate,
  } = useSBG();

  // Find if editing an existing estimate
  const existingEstimate = isEditMode && targetId ? estimates.find((e) => e.id === targetId) : undefined;
  const isEditing = Boolean(isEditMode && existingEstimate);

  // Check if targetId specifies a transactionType or customer (e.g. 'SALE', 'PURCHASE', 'cust-101::SALE')
  let initialTransactionType: 'PURCHASE' | 'SALE' = 'PURCHASE';
  let initialCustId = preselectedCustomerId || '';

  if (targetId === 'SALE' || targetId === 'PURCHASE') {
    initialTransactionType = targetId;
  } else if (targetId && targetId.includes('::')) {
    const [cId, tType] = targetId.split('::');
    if (cId) initialCustId = cId;
    if (tType === 'SALE' || tType === 'PURCHASE') initialTransactionType = tType;
  } else if (existingEstimate?.transactionType) {
    initialTransactionType = existingEstimate.transactionType;
  }

  const [customerId, setCustomerId] = useState(
    existingEstimate?.customerId || initialCustId || customers[0]?.id || ''
  );
  const [orderId, setOrderId] = useState(existingEstimate?.orderId || '');
  const [estimateNo, setEstimateNo] = useState(() =>
    existingEstimate?.estimateNo || `EST-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [estimateDate, setEstimateDate] = useState(() =>
    existingEstimate?.estimateDate || new Date().toISOString().split('T')[0]
  );
  const [customerRef, setCustomerRef] = useState(existingEstimate?.customerRef || '');
  const [touchFixed, setTouchFixed] = useState(existingEstimate?.touchFixed ?? true);
  const [isGold, setIsGold] = useState(existingEstimate?.isGold ?? true);
  const [goldRate, setGoldRate] = useState<number | string>(
    existingEstimate?.goldRate || goldMarketRate
  );
  const [goldRatePurity, setGoldRatePurity] = useState<number | string>(
    existingEstimate?.goldRatePurity !== undefined ? existingEstimate.goldRatePurity : 100
  );
  const [diamondRate, setDiamondRate] = useState<number | string>(
    existingEstimate?.diamondRate ?? 0
  );
  const [stoneRate, setStoneRate] = useState<number | string>(
    existingEstimate?.stoneRate ?? 0
  );
  const [mcRate, setMcRate] = useState<number | string>(
    existingEstimate?.mcRate ?? 0
  );
  const [wastagePercent, setWastagePercent] = useState<number>(existingEstimate?.wastagePercent || 0);
  const [unfixGoldRate, setUnfixGoldRate] = useState<number>(existingEstimate?.unfixGoldRate || 0);
  const [remarks, setRemarks] = useState(existingEstimate?.remarks || '');
  const [transactionType, setTransactionType] = useState<'PURCHASE' | 'SALE'>(initialTransactionType);
  const [settlementMode, setSettlementMode] = useState<'FIX' | 'UNFIX' | 'GOLD_AND_CASH' | 'CASH_ONLY' | 'GOLD_ONLY'>(
    (existingEstimate?.settlementMode as any) || 'UNFIX'
  );
  const [unfixPreset, setUnfixPreset] = useState<UnfixPresetType>(
    existingEstimate?.unfixPreset || 'B2B_WITHOUT_MC'
  );
  const [huidCharges, setHuidCharges] = useState<number>(
    existingEstimate?.additionalExpenses?.huidCharges || 0
  );
  const [courierCharges, setCourierCharges] = useState<number>(
    existingEstimate?.additionalExpenses?.courierCharges || 0
  );
  const [otherCharges, setOtherCharges] = useState<number>(
    existingEstimate?.additionalExpenses?.otherCharges || 0
  );
  const [otherChargesRemarks, setOtherChargesRemarks] = useState<string>(
    existingEstimate?.additionalExpenses?.otherChargesRemarks || ''
  );
  const [customSettlement, setCustomSettlement] = useState<UnfixComponentSettlement>(
    existingEstimate?.unfixComponentSettlement || {
      goldMetalMode: 'GOLD',
      goldGSTMode: 'GOLD',
      mcMode: 'CASH',
      stonesMode: 'CASH',
      expensesMode: 'CASH',
      goldPaidInMetalGrams: 0,
    }
  );
  const [showExpensesSection, setShowExpensesSection] = useState<boolean>(
    Boolean(
      (existingEstimate?.additionalExpenses?.huidCharges && existingEstimate.additionalExpenses.huidCharges > 0) ||
      (existingEstimate?.additionalExpenses?.courierCharges && existingEstimate.additionalExpenses.courierCharges > 0) ||
      (existingEstimate?.additionalExpenses?.otherCharges && existingEstimate.additionalExpenses.otherCharges > 0)
    )
  );

  useEffect(() => {
    if (targetId === 'SALE' || targetId === 'PURCHASE') {
      setTransactionType(targetId);
    } else if (targetId && targetId.includes('::')) {
      const [cId, tType] = targetId.split('::');
      if (cId) setCustomerId(cId);
      if (tType === 'SALE' || tType === 'PURCHASE') setTransactionType(tType);
    }
  }, [targetId]);

  // Load existing line items or empty by default
  const [items, setItems] = useState<Partial<EstimateLineItem>[]>(() => {
    if (existingEstimate && existingEstimate.items && existingEstimate.items.length > 0) {
      return existingEstimate.items;
    }
    return [];
  });

  // Re-sync if existingEstimate changes
  useEffect(() => {
    if (existingEstimate) {
      setCustomerId(existingEstimate.customerId);
      setOrderId(existingEstimate.orderId || '');
      setEstimateNo(existingEstimate.estimateNo);
      setEstimateDate(existingEstimate.estimateDate);
      setCustomerRef(existingEstimate.customerRef || '');
      setTouchFixed(existingEstimate.touchFixed ?? true);
      setIsGold(existingEstimate.isGold ?? true);
      setGoldRate(existingEstimate.goldRate || goldMarketRate);
      setGoldRatePurity(existingEstimate.goldRatePurity !== undefined ? existingEstimate.goldRatePurity : 100);
      setDiamondRate(existingEstimate.diamondRate ?? 0);
      setStoneRate(existingEstimate.stoneRate ?? 0);
      setMcRate(existingEstimate.mcRate ?? 0);
      setWastagePercent(existingEstimate.wastagePercent || 0);
      setUnfixGoldRate(existingEstimate.unfixGoldRate || 0);
      setRemarks(existingEstimate.remarks || '');
      setTransactionType(existingEstimate.transactionType || 'PURCHASE');
      setSettlementMode(existingEstimate.settlementMode || 'GOLD_AND_CASH');
      if (existingEstimate.unfixPreset) setUnfixPreset(existingEstimate.unfixPreset);
      if (existingEstimate.additionalExpenses) {
        setHuidCharges(existingEstimate.additionalExpenses.huidCharges || 0);
        setCourierCharges(existingEstimate.additionalExpenses.courierCharges || 0);
        setOtherCharges(existingEstimate.additionalExpenses.otherCharges || 0);
        setOtherChargesRemarks(existingEstimate.additionalExpenses.otherChargesRemarks || '');
        if (
          (existingEstimate.additionalExpenses.huidCharges && existingEstimate.additionalExpenses.huidCharges > 0) ||
          (existingEstimate.additionalExpenses.courierCharges && existingEstimate.additionalExpenses.courierCharges > 0) ||
          (existingEstimate.additionalExpenses.otherCharges && existingEstimate.additionalExpenses.otherCharges > 0)
        ) {
          setShowExpensesSection(true);
        }
      }
      if (existingEstimate.unfixComponentSettlement) {
        setCustomSettlement(existingEstimate.unfixComponentSettlement);
      }
      if (existingEstimate.items && existingEstimate.items.length > 0) {
        setItems(existingEstimate.items);
      }
    }
  }, [existingEstimate?.id]);

  useEffect(() => {
    if (!customerId && customers.length > 0) {
      setCustomerId(customers[0].id);
    }
  }, [customerId, customers]);

  const selectedCustomer = customers.find((c) => c.id === customerId) || customers[0];
  const customerOrders = orders.filter((o) => o.customerId === (selectedCustomer?.id || customerId));

  // Live Calculated Estimate via Calculation Engine
  const calculatedEstimate = calculateEstimateSheet(
    {
      id: existingEstimate ? existingEstimate.id : 'draft-est',
      estimateNo,
      estimateDate,
      customerId,
      customerName: selectedCustomer?.name,
      orderId: orderId || undefined,
      customerRef,
      touchFixed,
      isGold,
      goldRate: Number(goldRate) || 0,
      goldRatePurity: Number(goldRatePurity) || 100,
      diamondRate: Number(diamondRate) || 0,
      stoneRate: Number(stoneRate) || 0,
      mcRate: Number(mcRate) || 0,
      wastagePercent,
      unfixGoldRate: unfixGoldRate || undefined,
      transactionType,
      settlementMode,
      unfixPreset,
      unfixComponentSettlement: unfixPreset === 'CUSTOM' ? customSettlement : undefined,
      additionalExpenses: {
        huidCharges: Number(huidCharges) || 0,
        courierCharges: Number(courierCharges) || 0,
        otherCharges: Number(otherCharges) || 0,
        otherChargesRemarks: otherChargesRemarks || undefined,
      },
      direction: transactionType === 'PURCHASE' ? ('RECEIPT' as const) : ('ISSUE' as const),
      remarks,
      items: items as any,
      balanceComparison: {
        ledgerOldPureWT: selectedCustomer?.currentWT || 0,
        ledgerOldAmount: selectedCustomer?.currentMC || 0,
        gSheetOldPureWT: selectedCustomer?.currentWT || 0,
        gSheetOldAmount: selectedCustomer?.currentMC || 0,
        gSheetNewPureWT: 0,
        gSheetNewAmount: 0,
        ledgerNewPureWT: 0,
        ledgerNewAmount: 0,
        pureWTDiff: 0,
        amountDiff: 0,
        isReconciled: true,
      },
    },
    defaultGSTRate
  );

  const handleApplyMasterRatesToAllLines = () => {
    const purity = Number(goldRatePurity) || 100;
    setItems((prev) =>
      prev.map((item) => {
        let rate = item.rate || 0;
        let rateUnit: RateUnit = item.rateUnit || 'PER_G';

        if (item.category === 'GOLD') {
          rate = Number(((Number(goldRate) || 0) * (purity / 100)).toFixed(4));
          rateUnit = 'PER_G';
        } else if (item.category === 'DIAMOND') {
          rate = Number(diamondRate) || 0;
          rateUnit = 'PER_CT';
        } else if (item.category === 'PRECIOUS_STONE') {
          rate = Number(stoneRate) || 0;
          rateUnit = 'PER_CT';
        } else if (item.category === 'MAKING_CHARGE') {
          rate = Number(mcRate) || 0;
          rateUnit = 'PER_G';
        }

        return {
          ...item,
          rate,
          rateUnit,
        };
      })
    );
  };

  const handleUpdateLine = (index: number, updates: Partial<EstimateLineItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleAddLine = (category: EstimateItemCategory = 'GOLD') => {
    const defaultTouch = category === 'GOLD' ? 91.6 : 0;
    const baseRate = Number(goldRate) || 0;
    const purity = Number(goldRatePurity) || 100;
    let defaultRate = baseRate;
    let defaultUnit: RateUnit = 'PER_G';

    if (category === 'GOLD') {
      defaultRate = Number(((baseRate * purity) / 100).toFixed(4));
    } else if (category === 'DIAMOND') {
      defaultRate = Number(diamondRate) || 0;
      defaultUnit = 'PER_CT';
    } else if (category === 'PRECIOUS_STONE') {
      defaultRate = Number(stoneRate) || 0;
      defaultUnit = 'PER_CT';
    } else if (category === 'MAKING_CHARGE') {
      defaultRate = Number(mcRate) || 0;
      defaultUnit = 'PER_G';
    }

    setItems((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${prev.length + 1}`,
        sl: prev.length + 1,
        item: `New ${category.replace('_', ' ')} item`,
        category,
        nos: 1,
        grossWT: 0,
        stoneWT: 0,
        stoneWTCarats: 0,
        stoneWTUnit: category === 'DIAMOND' || category === 'PRECIOUS_STONE' ? 'ct' : 'g',
        touch: defaultTouch,
        rate: defaultRate,
        rateUnit: defaultUnit,
      },
    ]);
  };

  const handleDeleteLine = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateLine = (index: number) => {
    const itemToDup = items[index];
    setItems((prev) => [
      ...prev.slice(0, index + 1),
      {
        ...itemToDup,
        id: `line-${Date.now()}`,
        sl: prev.length + 1,
        item: `${itemToDup?.item || 'Item'} (Copy)`,
      },
      ...prev.slice(index + 1),
    ]);
  };

  // Sub-items Expansion & Management State
  const [expandedSubItems, setExpandedSubItems] = useState<Record<string, boolean>>({});

  const toggleSubItems = (lineId: string) => {
    setExpandedSubItems((prev) => ({
      ...prev,
      [lineId]: !prev[lineId],
    }));
  };

  const handleAddSubItem = (
    lineIndex: number,
    preset?: {
      name?: string;
      category?: EstimateItemCategory;
      unit?: 'g' | 'ct';
      touch?: number;
      rate?: number;
      rateUnit?: RateUnit;
    }
  ) => {
    const parentLine = items[lineIndex];
    if (!parentLine) return;

    const defaultCategory = preset?.category || 'PRECIOUS_STONE';
    const defaultUnit: 'g' | 'ct' =
      preset?.unit ||
      (defaultCategory === 'PRECIOUS_STONE' || defaultCategory === 'DIAMOND' ? 'ct' : 'g');
    const purity = Number(goldRatePurity) || 100;
    const defaultRate =
      preset?.rate ??
      (defaultCategory === 'GOLD'
        ? Number(((Number(goldRate) || 0) * (purity / 100)).toFixed(4))
        : defaultCategory === 'DIAMOND'
        ? Number(diamondRate) || 0
        : defaultCategory === 'PRECIOUS_STONE'
        ? Number(stoneRate) || 0
        : defaultCategory === 'MAKING_CHARGE'
        ? Number(mcRate) || 0
        : 0);
    const defaultRateUnit: RateUnit =
      preset?.rateUnit || (defaultUnit === 'ct' ? 'PER_CT' : 'PER_G');

    const newSubItem: EstimateSubItem = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name:
        preset?.name ||
        (defaultCategory === 'GOLD'
          ? 'Gold Casting'
          : defaultCategory === 'PRECIOUS_STONE'
          ? 'Rubie'
          : defaultCategory === 'DIAMOND'
          ? 'Diamond'
          : 'Making Charges'),
      category: defaultCategory,
      nos: 1,
      weight: 0,
      unit: defaultUnit,
      touch: preset?.touch ?? (defaultCategory === 'GOLD' ? (parentLine.touch || 76) : 0),
      rate: defaultRate,
      rateUnit: defaultRateUnit,
      amount: 0,
    };

    const currentSubs = parentLine.subItems || [];
    const updatedSubs = [...currentSubs, newSubItem];

    handleUpdateLine(lineIndex, { subItems: updatedSubs });

    const lineKey = parentLine.id || `line-${lineIndex}`;
    setExpandedSubItems((prev) => ({
      ...prev,
      [lineKey]: true,
    }));
  };

  const handleUpdateSubItem = (
    lineIndex: number,
    subIndex: number,
    updates: Partial<EstimateSubItem>
  ) => {
    const parentLine = items[lineIndex];
    if (!parentLine || !parentLine.subItems) return;

    const updatedSubs = [...parentLine.subItems];
    updatedSubs[subIndex] = { ...updatedSubs[subIndex], ...updates };

    handleUpdateLine(lineIndex, { subItems: updatedSubs });
  };

  const handleDeleteSubItem = (lineIndex: number, subIndex: number) => {
    const parentLine = items[lineIndex];
    if (!parentLine || !parentLine.subItems) return;

    const updatedSubs = parentLine.subItems.filter((_, i) => i !== subIndex);
    handleUpdateLine(lineIndex, { subItems: updatedSubs });
  };

  const handleSaveEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert('Please select a customer account first.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one line item to the estimate.');
      return;
    }

    const payload = {
      ...calculatedEstimate,
      transactionType,
      settlementMode,
      unfixPreset,
      unfixComponentSettlement: unfixPreset === 'CUSTOM' ? customSettlement : undefined,
      additionalExpenses: {
        huidCharges: Number(huidCharges) || 0,
        courierCharges: Number(courierCharges) || 0,
        otherCharges: Number(otherCharges) || 0,
        otherChargesRemarks: otherChargesRemarks || undefined,
      },
      direction: transactionType === 'PURCHASE' ? ('RECEIPT' as const) : ('ISSUE' as const),
    };

    if (existingEstimate) {
      updateEstimate(existingEstimate.id, {
        ...payload,
        id: existingEstimate.id,
        status: existingEstimate.status || 'DRAFT',
      });
      onNavigate('estimate-details', existingEstimate.id);
    } else {
      addEstimate(payload);
      onNavigate('estimate-details', calculatedEstimate.id);
    }
  };

  const handleSaveAndConfirmEstimate = async () => {
    if (!customerId) {
      alert('Please select a customer account first.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one line item to the estimate.');
      return;
    }

    const estId = existingEstimate ? existingEstimate.id : `est-${Date.now()}`;
    const isFix = settlementMode === 'FIX' || settlementMode === 'CASH_ONLY';
    const settledGold = calculatedEstimate.totals.settledGoldWT ?? (isFix ? 0 : (calculatedEstimate.totals.goldPureWT ?? calculatedEstimate.totals.totalPureWT));
    const settledCash = calculatedEstimate.totals.settledCashAmount ?? (isFix ? calculatedEstimate.totals.grandTotal : (calculatedEstimate.totals.remainingCashValue ?? calculatedEstimate.totals.grandTotal));

    const deltaPureWT = calculatedEstimate.balanceComparison?.deltaPureWT ??
      (transactionType === 'PURCHASE' ? -settledGold : settledGold);
    const deltaAmount = calculatedEstimate.balanceComparison?.deltaAmount ??
      (transactionType === 'PURCHASE' ? -settledCash : settledCash);

    const prevWT = selectedCustomer?.currentWT || 0;
    const prevMC = selectedCustomer?.currentMC || 0;
    const newBalWT = calculatedEstimate.balanceComparison?.ledgerNewPureWT ?? Number((prevWT + deltaPureWT).toFixed(3));
    const newBalMC = calculatedEstimate.balanceComparison?.ledgerNewAmount ?? Number((prevMC + deltaAmount).toFixed(2));

    const estimateToSave = {
      ...calculatedEstimate,
      id: estId,
      status: 'CONFIRMED' as const,
      transactionType,
      settlementMode,
      unfixPreset,
      unfixComponentSettlement: unfixPreset === 'CUSTOM' ? customSettlement : undefined,
      additionalExpenses: {
        huidCharges: Number(huidCharges) || 0,
        courierCharges: Number(courierCharges) || 0,
        otherCharges: Number(otherCharges) || 0,
        otherChargesRemarks: otherChargesRemarks || undefined,
      },
      direction: transactionType === 'PURCHASE' ? ('RECEIPT' as const) : ('ISSUE' as const),
      previousBalanceWT: prevWT,
      previousBalanceMC: prevMC,
      deltaPureWT,
      deltaAmount,
      newBalanceWT: newBalWT,
      newBalanceMC: newBalMC,
    };

    if (existingEstimate) {
      await updateEstimate(existingEstimate.id, estimateToSave);
      await confirmEstimate(existingEstimate.id, estimateToSave);
    } else {
      await addEstimate(estimateToSave);
      await confirmEstimate(estId, estimateToSave);
    }

    onNavigate('estimate-details', estId);
  };

  const handleSaveAsNewCopy = () => {
    if (!customerId) return;
    const newEstNo = `EST-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newEst = {
      ...calculatedEstimate,
      id: `est-${Date.now()}`,
      estimateNo: newEstNo,
      status: 'DRAFT' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addEstimate(newEst);
    onNavigate('estimate-details', newEst.id);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${estimateNo} - ${selectedCustomer?.name || 'Customer'} - SBG Cost Sheet`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Helper handlers for Settlement Configuration
  const handlePresetChange = (newPreset: string) => {
    if (newPreset === 'FIX') {
      setSettlementMode('FIX');
      setUnfixPreset('CUSTOM');
      setCustomSettlement({
        goldMetalMode: 'CASH',
        goldGSTMode: 'CASH',
        mcMode: 'CASH',
        stonesMode: 'CASH',
        expensesMode: 'CASH',
        otherGstMode: 'CASH',
        goldPaidInMetalGrams: 0,
        goldPaidInCashAmount: 0,
      });
    } else if (newPreset === 'B2B_WITHOUT_MC') {
      setSettlementMode('UNFIX');
      setUnfixPreset('B2B_WITHOUT_MC');
      setCustomSettlement({
        goldMetalMode: 'GOLD',
        goldGSTMode: 'GOLD',
        mcMode: 'CASH',
        stonesMode: 'CASH',
        expensesMode: 'CASH',
        otherGstMode: 'CASH',
        goldPaidInMetalGrams: 0,
        goldPaidInCashAmount: 0,
      });
    } else if (newPreset === 'B2B_WITH_MC') {
      setSettlementMode('UNFIX');
      setUnfixPreset('B2B_WITH_MC');
      setCustomSettlement({
        goldMetalMode: 'GOLD',
        goldGSTMode: 'GOLD',
        mcMode: 'GOLD',
        stonesMode: 'CASH',
        expensesMode: 'CASH',
        otherGstMode: 'CASH',
        goldPaidInMetalGrams: 0,
        goldPaidInCashAmount: 0,
      });
    } else if (newPreset === 'ALL_IN_GOLD') {
      setSettlementMode('UNFIX');
      setUnfixPreset('ALL_IN_GOLD');
      setCustomSettlement({
        goldMetalMode: 'GOLD',
        goldGSTMode: 'GOLD',
        mcMode: 'GOLD',
        stonesMode: 'GOLD',
        expensesMode: 'GOLD',
        otherGstMode: 'GOLD',
        goldPaidInMetalGrams: 0,
        goldPaidInCashAmount: 0,
      });
    } else {
      setSettlementMode('UNFIX');
      setUnfixPreset('CUSTOM');
    }
  };

  const getBaselineForPreset = (preset: UnfixPresetType): UnfixComponentSettlement => {
    if (preset === 'B2B_WITH_MC') {
      return { goldMetalMode: 'GOLD', goldGSTMode: 'GOLD', mcMode: 'GOLD', stonesMode: 'CASH', expensesMode: 'CASH', otherGstMode: 'CASH', goldPaidInMetalGrams: 0, goldPaidInCashAmount: 0 };
    }
    if (preset === 'ALL_IN_GOLD') {
      return { goldMetalMode: 'GOLD', goldGSTMode: 'GOLD', mcMode: 'GOLD', stonesMode: 'GOLD', expensesMode: 'GOLD', otherGstMode: 'GOLD', goldPaidInMetalGrams: 0, goldPaidInCashAmount: 0 };
    }
    return { goldMetalMode: 'GOLD', goldGSTMode: 'GOLD', mcMode: 'CASH', stonesMode: 'CASH', expensesMode: 'CASH', otherGstMode: 'CASH', goldPaidInMetalGrams: 0, goldPaidInCashAmount: 0 };
  };

  const updateCustomRow = (key: keyof UnfixComponentSettlement, value: any) => {
    setSettlementMode('UNFIX');
    setUnfixPreset('CUSTOM');
    setCustomSettlement((prev) => {
      const base = unfixPreset !== 'CUSTOM' ? getBaselineForPreset(unfixPreset) : prev;
      return {
        ...base,
        [key]: value,
      };
    });
  };

  const isFix = settlementMode === 'FIX' || settlementMode === 'CASH_ONLY';
  const activePresetValue = isFix ? 'FIX' : (unfixPreset || 'B2B_WITHOUT_MC');

  const currentMetalMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? customSettlement.goldMetalMode : 'GOLD');
  const currentGoldGstMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? customSettlement.goldGSTMode : 'GOLD');
  const currentMcMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? customSettlement.mcMode : (unfixPreset === 'B2B_WITH_MC' || unfixPreset === 'ALL_IN_GOLD' ? 'GOLD' : 'CASH'));
  const currentStonesMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? customSettlement.stonesMode : (unfixPreset === 'ALL_IN_GOLD' ? 'GOLD' : 'CASH'));
  const currentExpensesMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? customSettlement.expensesMode : (unfixPreset === 'ALL_IN_GOLD' ? 'GOLD' : 'CASH'));
  const currentOtherGstMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? (customSettlement.otherGstMode || 'CASH') : (unfixPreset === 'ALL_IN_GOLD' ? 'GOLD' : 'CASH'));

  const effectiveGoldRate = (unfixGoldRate && unfixGoldRate > 0) ? Number(unfixGoldRate) : (Number(goldRate) > 0 ? Number(goldRate) : 1);
  const goldPureToAdjust = calculatedEstimate.totals.goldPureWT ?? calculatedEstimate.totals.totalPureWT;
  const goldMetalValue = calculatedEstimate.totals.goldValue;

  const goldGstAmount = calculatedEstimate.totals.goldGstAmount ?? Number((goldMetalValue * ((calculatedEstimate.totals.gstRate || 3) / 100)).toFixed(2));
  const goldGstGrams = Number((goldGstAmount / effectiveGoldRate).toFixed(3));

  const mcValue = calculatedEstimate.totals.mcValue;
  const mcGrams = Number((mcValue / effectiveGoldRate).toFixed(3));

  const stonesTotal = calculatedEstimate.totals.diamondValue + calculatedEstimate.totals.psValue;
  const stonesGrams = Number((stonesTotal / effectiveGoldRate).toFixed(3));

  const expensesTotal = calculatedEstimate.totals.totalExpenses ?? (huidCharges + courierCharges + otherCharges);
  const expensesGrams = Number((expensesTotal / effectiveGoldRate).toFixed(3));

  const otherGstAmount = calculatedEstimate.totals.nonGoldGstAmount ?? Math.max(0, Number((calculatedEstimate.totals.gstAmount - goldGstAmount).toFixed(2)));
  const otherGstGrams = Number((otherGstAmount / effectiveGoldRate).toFixed(3));

  const settledGoldWT = calculatedEstimate.totals.settledGoldWT ?? (isFix ? 0 : goldPureToAdjust);
  const settledCashAmount = calculatedEstimate.totals.settledCashAmount ?? (isFix ? calculatedEstimate.totals.grandTotal : (calculatedEstimate.totals.remainingCashValue ?? calculatedEstimate.totals.grandTotal));
  const goldSettleValue = settledGoldWT * effectiveGoldRate;

  const isPurchase = transactionType === 'PURCHASE';
  const displayDeltaPureWT = isPurchase ? -settledGoldWT : settledGoldWT;
  const displayDeltaAmount = isPurchase ? -settledCashAmount : settledCashAmount;

  const currentWT = selectedCustomer?.currentWT || 0;
  const currentMC = selectedCustomer?.currentMC || 0;

  const newBalWT = Number((currentWT + displayDeltaPureWT).toFixed(3));
  const newBalMC = Number((currentMC + displayDeltaAmount).toFixed(2));

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <button
            onClick={() => onNavigate('estimates')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#173333] hover:text-[#0F5C5B] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Estimates
          </button>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl font-bold text-[#173333] tracking-tight">Estimate {estimateNo}</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E6F4F1] text-[#0F5C5B] border border-[#0F5C5B]/20 uppercase tracking-wider">
              Draft
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg border border-[#DCE5E3] bg-white text-xs font-semibold text-[#173333] hover:bg-gray-50 shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Print Estimate Cost Sheet"
          >
            <Printer className="w-3.5 h-3.5 text-[#0F5C5B]" /> Print
          </button>
          <button
            type="button"
            onClick={() => onNavigate('estimates')}
            className="px-3.5 py-1.5 rounded-lg border border-[#DCE5E3] bg-white text-xs font-semibold text-[#173333] hover:bg-gray-50 shadow-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveEstimate}
            className="px-3.5 py-1.5 rounded-lg border border-[#DCE5E3] bg-white text-xs font-semibold text-[#173333] hover:bg-gray-50 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-[#647777]" /> Save as Draft
          </button>
          <button
            type="button"
            onClick={handleSaveAsNewCopy}
            className="px-3.5 py-1.5 rounded-lg border border-[#DCE5E3] bg-white text-xs font-semibold text-[#173333] hover:bg-gray-50 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-[#647777]" /> Save as New Copy
          </button>
          <button
            type="button"
            onClick={handleSaveAndConfirmEstimate}
            className="px-4 py-1.5 rounded-lg bg-[#0F5C5B] text-xs font-bold text-white hover:bg-[#0c4a49] shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5" /> Save & Confirm to Ledger
          </button>
        </div>
      </div>

      {/* Commercial Print Header (Visible Only When Printing) */}
      <div className="hidden print:block border-b border-[#DCE5E3] pb-4 mb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <img src="/sbg-brand-logo.png" alt="Sree Balaji Gold" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-wider text-[#0F5C5B]">SREE BALAJI GOLD</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0F5C5B]/10 text-[#0F5C5B] uppercase">
                  {isPurchase ? 'PURCHASE / RECEIPT' : 'SALE / ISSUE'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#D9B76C]/20 text-[#8C6D23] uppercase">
                  ESTIMATE COST SHEET
                </span>
              </div>
            </div>
          </div>

          <div className="text-right space-y-0.5 text-xs">
            <div className="text-base font-mono font-bold text-[#0F5C5B]">{estimateNo}</div>
            <div className="text-[#647777]">Date: <strong className="text-[#173333]">{formatDateDDMMYYYY(estimateDate)}</strong></div>
            {customerRef && (
              <div className="text-[#647777]">Job Ref: <strong className="text-[#173333]">{customerRef}</strong></div>
            )}
          </div>
        </div>

        {/* Customer & Applied Metal Rates Box */}
        <div className="grid grid-cols-2 gap-4 mt-3 bg-[#0F5C5B]/5 p-3 rounded-xl border border-[#0F5C5B]/15 text-xs break-inside-avoid">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-[#647777] uppercase tracking-wider block">
              Billed To Customer
            </span>
            <h4 className="text-sm font-bold text-[#0F5C5B]">
              {selectedCustomer?.name || 'Customer'} ({selectedCustomer?.code || 'ACC'})
            </h4>
            <p className="text-[#647777] text-[11px]">
              {[selectedCustomer?.phone, selectedCustomer?.city || 'Mumbai, Maharashtra'].filter(Boolean).join(' | ')}
            </p>
            {selectedCustomer?.gstin && (
              <p className="font-mono text-[10px] text-[#173333]">GSTIN: {selectedCustomer.gstin}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-right">
            <div>
              <span className="text-[9px] font-bold text-[#647777] uppercase tracking-wider block">
                Applied Gold Rate
              </span>
              <span className="font-mono font-bold text-sm text-[#173333]">
                ₹{Number(goldRate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g
              </span>
              <span className="text-[10px] text-[#647777] block">Purity: {goldRatePurity}%</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-[#647777] uppercase tracking-wider block">
                Settlement Mode
              </span>
              <span className="font-semibold text-[#0F5C5B]">
                {settlementMode === 'FIX' ? 'FIX (100% Cash)' : `UNFIX (${unfixPreset.replace(/_/g, ' ')})`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Parameters Card */}
      <div className="bg-white rounded-xl border border-[#DCE5E3] p-4 shadow-xs no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
          <div>
            <label className="block text-xs font-bold text-[#173333] mb-1">Customer Account</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-white border border-[#DCE5E3] rounded-lg text-[#173333] focus:border-[#0F5C5B] focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#173333] mb-1">Estimate Date</label>
            <input
              type="date"
              value={estimateDate}
              onChange={(e) => setEstimateDate(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-white border border-[#DCE5E3] rounded-lg text-[#173333] focus:border-[#0F5C5B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#173333] mb-1">Customer Job Reference</label>
            <input
              type="text"
              placeholder="e.g. KVJ-SPEC-01"
              value={customerRef}
              onChange={(e) => setCustomerRef(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-white border border-[#DCE5E3] rounded-lg text-[#173333] focus:border-[#0F5C5B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#173333] mb-1">Estimate Type</label>
            <div className="flex rounded-lg bg-[#EAEFEF] p-0.5 border border-[#DCE5E3]">
              <button
                type="button"
                onClick={() => setTransactionType('PURCHASE')}
                className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  transactionType === 'PURCHASE'
                    ? 'bg-[#0F5C5B] text-white shadow-xs'
                    : 'text-[#647777] hover:text-[#0F5C5B]'
                }`}
              >
                PURCHASE (Receipt −)
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('SALE')}
                className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  transactionType === 'SALE'
                    ? 'bg-[#0F5C5B] text-white shadow-xs'
                    : 'text-[#647777] hover:text-[#0F5C5B]'
                }`}
              >
                SALE (Issue +)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Master Rates Control Bar */}
      <div className="bg-white rounded-xl border border-[#DCE5E3] px-4 py-3 shadow-xs no-print">
        <div className="flex flex-wrap items-end gap-3.5 xl:gap-4">
          <div className="flex items-center gap-2 mr-2 self-center pt-3.5">
            <div className="w-7 h-7 rounded-lg bg-[#0F5C5B] text-white flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-[#173333] whitespace-nowrap">Master Rates</span>
          </div>

          <div className="flex-1 min-w-[175px]">
            <label className="block text-[11px] font-semibold text-[#647777] mb-1">Pure Gold Rate without GST</label>
            <input
              type="number"
              step="0.01"
              value={goldRate}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setGoldRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
              onBlur={() => {
                if (goldRate === '' || isNaN(Number(goldRate))) setGoldRate(goldMarketRate);
              }}
              className="w-full text-xs font-mono font-semibold px-3 py-1.5 bg-white border border-[#DCE5E3] rounded-lg text-[#173333] focus:border-[#0F5C5B] focus:outline-none"
            />
          </div>

          <div className="flex-1 min-w-[125px]">
            <label className="block text-[11px] font-semibold text-[#647777] mb-1">Diamond Rate (₹/ct)</label>
            <input
              type="number"
              step="1"
              value={diamondRate}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setDiamondRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
              onBlur={() => {
                if (diamondRate === '' || isNaN(Number(diamondRate))) setDiamondRate(0);
              }}
              className="w-full text-xs font-mono font-semibold px-3 py-1.5 bg-white border border-[#DCE5E3] rounded-lg text-[#173333] focus:border-[#0F5C5B] focus:outline-none"
            />
          </div>

          <div className="flex-1 min-w-[110px]">
            <label className="block text-[11px] font-semibold text-[#647777] mb-1">Stone Rate (₹/ct)</label>
            <input
              type="number"
              step="1"
              value={stoneRate}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setStoneRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
              onBlur={() => {
                if (stoneRate === '' || isNaN(Number(stoneRate))) setStoneRate(0);
              }}
              className="w-full text-xs font-mono font-semibold px-3 py-1.5 bg-white border border-[#DCE5E3] rounded-lg text-[#173333] focus:border-[#0F5C5B] focus:outline-none"
            />
          </div>

          <div className="flex-1 min-w-[110px]">
            <label className="block text-[11px] font-semibold text-[#647777] mb-1">MC Rate (₹/g)</label>
            <input
              type="number"
              step="1"
              value={mcRate}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setMcRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
              onBlur={() => {
                if (mcRate === '' || isNaN(Number(mcRate))) setMcRate(0);
              }}
              className="w-full text-xs font-mono font-semibold px-3 py-1.5 bg-white border border-[#DCE5E3] rounded-lg text-[#173333] focus:border-[#0F5C5B] focus:outline-none"
            />
          </div>

          <div className="w-28">
            <label className="block text-[11px] font-semibold text-[#647777] mb-1">Gold Purity (%)</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={goldRatePurity}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setGoldRatePurity(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                onBlur={() => {
                  if (goldRatePurity === '' || isNaN(Number(goldRatePurity))) setGoldRatePurity(100);
                }}
                className="w-full text-xs font-mono font-semibold px-3 py-1.5 pr-6 bg-white border border-[#DCE5E3] rounded-lg text-[#173333] focus:border-[#0F5C5B] focus:outline-none"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#647777] font-semibold">%</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyMasterRatesToAllLines}
            className="px-3.5 py-1.5 rounded-lg bg-[#FDF6E2] text-[#8C6D23] border border-[#ECD9A5] hover:bg-[#F9ECC9] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8C6D23]" />
            Apply to All Lines
          </button>
        </div>
      </div>

      {/* Estimate Line Items Card */}
      <div className="bg-white rounded-xl border border-[#DCE5E3] shadow-xs overflow-hidden">
        <div className="p-3 bg-white border-b border-[#DCE5E3] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F5C5B] text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-[#173333]">Estimate Line Items</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={() => handleAddLine('GOLD')}
              className="px-3 py-1.5 rounded-lg border border-[#DCE5E3] bg-white text-xs font-semibold text-[#173333] hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Gold Line
            </button>
            <button
              type="button"
              onClick={() => handleAddLine('DIAMOND')}
              className="px-3 py-1.5 rounded-lg border border-[#DCE5E3] bg-white text-xs font-semibold text-[#173333] hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Diamond Line
            </button>
            <button
              type="button"
              onClick={() => handleAddLine('PRECIOUS_STONE')}
              className="px-3 py-1.5 rounded-lg border border-[#DCE5E3] bg-white text-xs font-semibold text-[#173333] hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Stone Line
            </button>
            <button
              type="button"
              onClick={() => handleAddLine('MAKING_CHARGE')}
              className="px-3 py-1.5 rounded-lg border border-[#DCE5E3] bg-white text-xs font-semibold text-[#173333] hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> MC Line
            </button>
          </div>
        </div>

        <div className="overflow-x-auto touch-scroll print:overflow-visible">
          <table className="w-full min-w-[1020px] print:min-w-0 text-left text-xs border-collapse">
            <thead className="text-[#647777] border-b border-[#DCE5E3] uppercase font-bold text-[10px] tracking-wider bg-gray-50/50">
              <tr>
                <th className="py-2.5 px-3 w-8">#</th>
                <th className="py-2.5 px-3 min-w-[150px]">Item Description</th>
                <th className="py-2.5 px-2 min-w-[120px]">Category</th>
                <th className="py-2.5 px-2 text-right w-14">Nos</th>
                <th className="py-2.5 px-2 text-right w-24">Gross WT (g)</th>
                <th className="py-2.5 px-2 text-right min-w-[120px]">Stone WT</th>
                <th className="py-2.5 px-2 text-right w-20">Net WT (g)</th>
                <th className="py-2.5 px-2 text-right w-16">Touch %</th>
                <th className="py-2.5 px-2 text-right w-20">Pure WT (g)</th>
                <th className="py-2.5 px-2 text-right min-w-[95px]">Rate (₹)</th>
                <th className="py-2.5 px-2 min-w-[80px]">Unit</th>
                <th className="py-2.5 px-3 text-right font-bold text-[#173333] min-w-[110px]">Line Amount (₹)</th>
                <th className="py-2.5 px-3 text-center w-16 no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5E3]/60">
              {calculatedEstimate.items.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-xs text-[#647777]">
                    <p className="font-semibold text-sm text-[#173333]">No line items added yet</p>
                    <p className="text-[11px] text-[#647777] mt-1">
                      Click the buttons above (+ Gold Line, + Diamond Line, + Stone Line, + MC Line) to add items.
                    </p>
                  </td>
                </tr>
              ) : (
                calculatedEstimate.items.map((line, idx) => {
                const isExpanded = !!expandedSubItems[line.id];
                const subCount = line.subItems?.length || 0;

                return (
                  <React.Fragment key={line.id}>
                    <tr className="hover:bg-white/60">
                      <td className="py-2.5 px-3 font-mono text-xs font-semibold text-[#173333]">
                        <div className="flex items-center gap-1.5">
                          <span>{idx + 1}</span>
                          <span className="text-[#8B9E9E] text-xs">›</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          value={line.item !== undefined ? line.item : ''}
                          placeholder="Enter description..."
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleUpdateLine(idx, { item: e.target.value })}
                          className="w-full text-xs font-semibold px-2 py-1 bg-white border border-[#DCE5E3] rounded-lg focus:outline-none focus:border-[#0F5C5B]"
                        />
                        {(line.category === 'GOLD' || subCount > 0) && (
                          <div className="flex items-center gap-1.5 mt-1 no-print">
                            <button
                              type="button"
                              onClick={() => toggleSubItems(line.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FDF6E2] text-[#8C6D23] border border-[#ECD9A5] hover:bg-[#FAF0D4] cursor-pointer shadow-2xs"
                              title="Sub-items"
                            >
                              <Layers className="w-3 h-3 text-[#8C6D23]" />
                              <span>Sub-items + Add</span>
                              <span className="text-[10px] font-bold">›</span>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <select
                          value={line.category}
                          onChange={(e) => handleUpdateLine(idx, { category: e.target.value as any })}
                          className="text-xs px-2 py-1 bg-white border border-[#DCE5E3] rounded-lg focus:outline-none font-medium"
                        >
                          <option value="GOLD">GOLD</option>
                          <option value="DIAMOND">DIAMOND</option>
                          <option value="PRECIOUS_STONE">PRECIOUS STONE</option>
                          <option value="MAKING_CHARGE">MAKING CHARGE</option>
                          <option value="FINDINGS">FINDINGS</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={line.nos === 0 ? '' : line.nos}
                          placeholder="1"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleUpdateLine(idx, { nos: e.target.value === '' ? ('' as any) : parseInt(e.target.value) || 0 })}
                          className="w-14 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.001"
                          value={line.grossWT === 0 ? '' : line.grossWT}
                          placeholder="0.000"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleUpdateLine(idx, { grossWT: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) || 0 })}
                          className="w-20 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono font-medium"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.001"
                            value={
                              line.stoneWTUnit === 'ct'
                                ? (line.stoneWTCarats === 0 ? '' : (line.stoneWTCarats ?? ''))
                                : (line.stoneWT === 0 ? '' : (line.stoneWT ?? ''))
                            }
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (line.stoneWTUnit === 'ct') {
                                handleUpdateLine(idx, {
                                  stoneWT: roundWeight(val * 0.2),
                                  stoneWTCarats: val,
                                });
                              } else {
                                handleUpdateLine(idx, {
                                  stoneWT: val,
                                  stoneWTCarats: roundWeight(val / 0.2),
                                });
                              }
                            }}
                            placeholder="0.000"
                            className="w-16 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono text-[#647777]"
                          />
                          <select
                            value={line.stoneWTUnit || 'g'}
                            onChange={(e) => {
                              const newUnit = e.target.value as 'g' | 'ct';
                              if (newUnit === line.stoneWTUnit) return;
                              if (newUnit === 'g') {
                                handleUpdateLine(idx, {
                                  stoneWTUnit: 'g',
                                  stoneWT: line.stoneWT,
                                  stoneWTCarats: line.stoneWTCarats,
                                });
                              } else {
                                const carats = (line.stoneWTCarats && line.stoneWTCarats > 0)
                                  ? line.stoneWTCarats
                                  : roundWeight((line.stoneWT || 0) / 0.2);
                                handleUpdateLine(idx, {
                                  stoneWTUnit: 'ct',
                                  stoneWT: line.stoneWT,
                                  stoneWTCarats: carats,
                                });
                              }
                            }}
                            className="text-[10px] px-1 py-1 bg-white border border-[#DCE5E3] rounded-lg font-bold text-[#0F5C5B] cursor-pointer"
                            title="Stone Weight Unit: Grams (g) or Carats (ct)"
                          >
                            <option value="g">g</option>
                            <option value="ct">ct</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-medium text-[#173333]">
                        {line.netWT.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={line.touch === 0 ? '' : line.touch}
                          placeholder="0.00"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const rawVal = e.target.value;
                            const newTouch = rawVal === '' ? 0 : parseFloat(rawVal) || 0;
                            handleUpdateLine(idx, {
                              touch: rawVal === '' ? ('' as any) : newTouch,
                            });
                          }}
                          className="w-16 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-medium text-xs text-[#173333]">
                        {line.pureWT.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={line.rate === 0 ? '' : line.rate}
                          placeholder="0.00"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleUpdateLine(idx, { rate: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) || 0 })}
                          className="w-24 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <select
                          value={line.rateUnit}
                          onChange={(e) => handleUpdateLine(idx, { rateUnit: e.target.value as any })}
                          className="text-xs px-2 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono"
                        >
                          <option value="PER_G">/g</option>
                          <option value="PER_CT">/ct</option>
                          <option value="PER_PIECE">/pc</option>
                          <option value="PERCENT">%</option>
                          <option value="LUMP_SUM">Fix</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-[#173333] whitespace-nowrap">
                        ₹ {line.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicateLine(idx)}
                            className="p-1 rounded text-[#647777] hover:text-[#173333] hover:bg-black/5 cursor-pointer"
                            title="Duplicate line"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(idx)}
                            className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Sub-items Breakdown */}
                    {isExpanded && (
                      <tr key={`${line.id}-subs`} className="bg-[#FAF9F6]/90 border-b border-[#DCE5E3]">
                        <td colSpan={13} className="py-3 px-3 pl-8">
                          <div className="bg-white rounded-xl border border-[#DCE5E3] p-3 shadow-xs space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#DCE5E3]">
                              <div className="flex items-center gap-2">
                                <CornerDownRight className="w-4 h-4 text-[#0F5C5B]" />
                                <span className="text-xs font-bold text-[#0F5C5B]">
                                  Sub-items for <span className="text-[#173333]">{line.item || 'Item'}</span>:
                                </span>
                                {subCount > 0 && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0F5C5B]/10 text-[#0F5C5B] font-bold">
                                    {subCount} Component{subCount > 1 ? 's' : ''}
                                  </span>
                                )}
                                {subCount === 0 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSubItems(line.id)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#B85C5C]/10 text-[#B85C5C] border border-[#B85C5C]/20 hover:bg-[#B85C5C]/20 transition-colors cursor-pointer"
                                    title="Remove empty sub-section"
                                  >
                                    <X className="w-3 h-3" />
                                    Remove sub-section
                                  </button>
                                )}
                              </div>

                              {/* Quick Add Sub-item Buttons */}
                              <div className="flex flex-wrap items-center gap-1.5 no-print">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddSubItem(idx, {
                                      name: 'Rubie',
                                      category: 'PRECIOUS_STONE',
                                      unit: 'ct',
                                      rate: Number(stoneRate) || 0,
                                      rateUnit: 'PER_CT',
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                                >
                                  + Rubie / Stone
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddSubItem(idx, {
                                      name: 'Gold Component',
                                      category: 'GOLD',
                                      unit: 'g',
                                      touch: line.touch || 76,
                                      rate: Number(((Number(goldRate) || 0) * ((Number(goldRatePurity) || 100) / 100)).toFixed(4)),
                                      rateUnit: 'PER_G',
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                                >
                                  + Gold
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddSubItem(idx, {
                                      name: 'Diamonds',
                                      category: 'DIAMOND',
                                      unit: 'ct',
                                      rate: Number(diamondRate) || 0,
                                      rateUnit: 'PER_CT',
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                                >
                                  + Diamond
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddSubItem(idx, {
                                      name: 'Making Charges',
                                      category: 'MAKING_CHARGE',
                                      unit: 'g',
                                      rate: Number(mcRate) || 0,
                                      rateUnit: 'PER_G',
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 cursor-pointer"
                                >
                                  + Making Charge
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddSubItem(idx)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#0F5C5B] text-white hover:bg-[#0D4E4D] cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Component
                                </button>
                              </div>
                            </div>

                            {/* Sub-items Table */}
                            {subCount === 0 ? (
                              <div className="py-4 text-center text-xs text-[#647777]">
                                <p>No sub-items added yet under this item.</p>
                                <p className="text-[11px] text-[#647777]/70 mt-0.5">
                                  Click &quot;+ Rubie / Stone&quot; or &quot;+ Add Component&quot; above to specify individual components.
                                </p>
                              </div>
                            ) : (
                              <div className="overflow-x-auto touch-scroll print:overflow-visible">
                                <table className="w-full min-w-[920px] print:min-w-0 text-left text-xs">
                                  <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#DCE5E3] uppercase font-bold text-[9px] tracking-wider">
                                    <tr>
                                      <th className="py-2 px-2 w-8">#</th>
                                      <th className="py-2 px-2 min-w-[130px]">Component Name</th>
                                      <th className="py-2 px-2 min-w-[110px]">Category</th>
                                      <th className="py-2 px-2 text-right w-16">Nos</th>
                                      <th className="py-2 px-2 text-right min-w-[120px]">Weight</th>
                                      <th className="py-2 px-2 text-right w-16">Touch %</th>
                                      <th className="py-2 px-2 text-right w-20">Pure WT</th>
                                      <th className="py-2 px-2 text-right min-w-[90px]">Rate (₹)</th>
                                      <th className="py-2 px-2 min-w-[70px]">Unit</th>
                                      <th className="py-2 px-2 text-right font-bold text-[#0F5C5B] min-w-[100px]">Amount (₹)</th>
                                      <th className="py-2 px-2 text-center w-10 no-print"></th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#EFECE6]">
                                    {line.subItems?.map((sub, sIdx) => (
                                      <tr key={sub.id} className="hover:bg-[#FAF9F6]/60">
                                        <td className="py-1.5 px-2 font-mono text-[#647777] text-[11px]">
                                          {idx + 1}.{sIdx + 1}
                                        </td>
                                        <td className="py-1.5 px-2">
                                          <input
                                            type="text"
                                            value={sub.name !== undefined ? sub.name : ''}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => handleUpdateSubItem(idx, sIdx, { name: e.target.value })}
                                            placeholder="e.g. Rubie"
                                            className="w-full text-xs font-medium px-2 py-1 bg-white border border-[#DCE5E3] rounded-lg focus:outline-none focus:border-[#0F5C5B]"
                                          />
                                        </td>
                                        <td className="py-1.5 px-2">
                                          <select
                                            value={sub.category}
                                            onChange={(e) => handleUpdateSubItem(idx, sIdx, { category: e.target.value as any })}
                                            className="text-xs px-2 py-1 bg-white border border-[#DCE5E3] rounded-lg focus:outline-none"
                                          >
                                            <option value="GOLD">GOLD</option>
                                            <option value="PRECIOUS_STONE">PRECIOUS STONE</option>
                                            <option value="DIAMOND">DIAMOND</option>
                                            <option value="MAKING_CHARGE">MAKING CHARGE</option>
                                            <option value="FINDINGS">FINDINGS</option>
                                            <option value="OTHER">OTHER</option>
                                          </select>
                                        </td>
                                        <td className="py-1.5 px-2 text-right">
                                          <input
                                            type="number"
                                            inputMode="numeric"
                                            value={sub.nos === 0 ? '' : sub.nos}
                                            placeholder="1"
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => handleUpdateSubItem(idx, sIdx, { nos: e.target.value === '' ? ('' as any) : parseInt(e.target.value) || 0 })}
                                            className="w-12 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono"
                                          />
                                        </td>
                                        <td className="py-1.5 px-2 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <input
                                              type="number"
                                              inputMode="decimal"
                                              step="0.001"
                                              value={sub.weight === 0 ? '' : sub.weight}
                                              onFocus={(e) => e.target.select()}
                                              onChange={(e) => handleUpdateSubItem(idx, sIdx, { weight: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) || 0 })}
                                              placeholder="0.00"
                                              className="w-16 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono font-medium"
                                            />
                                            <select
                                              value={sub.unit}
                                              onChange={(e) => handleUpdateSubItem(idx, sIdx, { unit: e.target.value as 'g' | 'ct' })}
                                              className="text-[10px] px-1 py-1 bg-white border border-[#DCE5E3] rounded-lg font-bold text-[#0F5C5B] cursor-pointer"
                                            >
                                              <option value="ct">ct</option>
                                              <option value="g">g</option>
                                            </select>
                                          </div>
                                          {Number(sub.weight) > 0 && (
                                            <div className="text-[9px] text-right font-mono text-[#0F5C5B] mt-0.5">
                                              {sub.unit === 'ct'
                                                ? `≈ ${(sub.weight * 0.2).toFixed(3)}g`
                                                : `≈ ${(sub.weight / 0.2).toFixed(2)}ct`}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-1.5 px-2 text-right">
                                          <input
                                            type="number"
                                            inputMode="decimal"
                                            step="0.01"
                                            value={sub.touch === 0 ? '' : sub.touch}
                                            placeholder="0.00"
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => handleUpdateSubItem(idx, sIdx, { touch: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) || 0 })}
                                            className="w-14 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono"
                                          />
                                        </td>
                                        <td className="py-1.5 px-2 text-right font-mono text-[#173333]">
                                          {(sub.pureWT || 0).toFixed(3)}g
                                        </td>
                                        <td className="py-1.5 px-2 text-right">
                                          <input
                                            type="number"
                                            inputMode="decimal"
                                            step="0.01"
                                            value={sub.rate === 0 ? '' : sub.rate}
                                            placeholder="0.00"
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => handleUpdateSubItem(idx, sIdx, { rate: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) || 0 })}
                                            className="w-20 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono"
                                          />
                                        </td>
                                        <td className="py-1.5 px-2">
                                          <select
                                            value={sub.rateUnit}
                                            onChange={(e) => handleUpdateSubItem(idx, sIdx, { rateUnit: e.target.value as any })}
                                            className="text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono"
                                          >
                                            <option value="PER_CT">/ct</option>
                                            <option value="PER_G">/g</option>
                                            <option value="PER_PIECE">/pc</option>
                                            <option value="LUMP_SUM">Fix</option>
                                          </select>
                                        </td>
                                        <td className="py-1.5 px-2 text-right font-mono font-bold text-[#0F5C5B]">
                                          <SBGCurrency value={sub.amount} />
                                        </td>
                                        <td className="py-1.5 px-2 text-center no-print">
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSubItem(idx, sIdx)}
                                            className="p-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                                            title="Remove sub-item"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })
              )}
            </tbody>
            <tfoot className="border-t border-[#DCE5E3] bg-[#FAF9F5] font-mono text-xs font-bold text-[#173333]">
              <tr>
                <td colSpan={4} className="py-2.5 px-3 font-sans font-bold text-xs text-[#173333]">
                  Total
                </td>
                <td className="py-2.5 px-2 text-right">
                  {calculatedEstimate.totals.totalGrossWT.toFixed(3)} g
                </td>
                <td className="py-2.5 px-2 text-right">
                  {calculatedEstimate.totals.totalStoneWT.toFixed(3)} g
                </td>
                <td className="py-2.5 px-2 text-right">
                  {calculatedEstimate.totals.totalNetWT.toFixed(3)} g
                </td>
                <td className="py-2.5 px-2 text-center text-[#647777] font-sans">
                  —
                </td>
                <td className="py-2.5 px-2 text-right font-black">
                  {calculatedEstimate.totals.totalPureWT.toFixed(3)} g
                </td>
                <td colSpan={2} className="py-2.5 px-2 text-right font-sans text-xs font-bold text-[#173333]">
                  Taxable Subtotal:
                </td>
                <td className="py-2.5 px-3 text-right font-black text-sm text-[#173333] whitespace-nowrap">
                  ₹ {calculatedEstimate.totals.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Material & Amount Summary (Incl. GST) */}
      <div className="bg-white rounded-xl border border-[#DCE5E3] p-4 shadow-xs space-y-3 break-inside-avoid">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0F5C5B] text-white flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold text-[#173333]">Material & Amount Summary (Incl. GST)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 print:grid-cols-4 gap-3 text-xs">
          {/* Card 1: Gold Metal Value */}
          <div className="bg-[#FAF9F5] rounded-xl border border-[#DCE5E3] p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Gold Metal Value</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                  GOLD
                </span>
              </div>
              <div className="text-lg font-black text-[#173333] font-mono leading-tight">
                ₹ {calculatedEstimate.totals.goldValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-bold text-[#173333] font-mono mt-0.5">
                {(calculatedEstimate.totals.goldPureWT ?? calculatedEstimate.totals.totalPureWT).toFixed(3)} g Pure Gold
              </div>
            </div>
            <div className="font-mono text-[10px] text-[#647777] border-t border-[#DCE5E3] pt-2 mt-2 flex justify-between">
              <span>Net WT: {(calculatedEstimate.totals.goldNetWT ?? calculatedEstimate.totals.totalNetWT).toFixed(3)} g</span>
              <span>Gross WT: {(calculatedEstimate.totals.goldGrossWT ?? calculatedEstimate.totals.totalGrossWT).toFixed(3)} g</span>
            </div>
          </div>

          {/* Card 2: Diamonds & Gemstones */}
          <div className="bg-[#FAF9F5] rounded-xl border border-[#DCE5E3] p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                  <Gem className="w-4 h-4 text-blue-600" />
                  <span>Diamonds & Gemstones</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                  DMD
                </span>
              </div>
              <div className="text-lg font-black text-[#173333] font-mono leading-tight">
                ₹ {(calculatedEstimate.totals.diamondValue + calculatedEstimate.totals.psValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="font-mono text-[10px] text-[#647777] border-t border-[#DCE5E3] pt-2 mt-2 flex justify-between">
              <span>DMD: {(calculatedEstimate.totals.diamondCarats ?? 0).toFixed(2)} ct</span>
              <span>PS: {(calculatedEstimate.totals.psCarats ?? 0).toFixed(2)} ct</span>
            </div>
          </div>

          {/* Card 3: Making Charges */}
          <div className="bg-[#FAF9F5] rounded-xl border border-[#DCE5E3] p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs">
                  <Wrench className="w-4 h-4 text-purple-600" />
                  <span>Making Charges</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 uppercase">
                  MC
                </span>
              </div>
              <div className="text-lg font-black text-purple-800 font-mono leading-tight">
                ₹ {calculatedEstimate.totals.mcValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="font-mono text-[10px] text-[#647777] border-t border-[#DCE5E3] pt-2 mt-2">
              <span>On Net WT: {(calculatedEstimate.totals.goldNetWT && calculatedEstimate.totals.goldNetWT > 0 ? calculatedEstimate.totals.goldNetWT : calculatedEstimate.totals.totalNetWT).toFixed(3)} g</span>
            </div>
          </div>

          {/* Card 4: Estimate Amount Summary */}
          <div className="bg-[#FAF9F5] rounded-xl border border-[#DCE5E3] p-3.5 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#0F5C5B]" />
              <span className="text-xs font-bold text-[#173333]">Estimate Amount Summary</span>
            </div>
            <div className="space-y-1.5 text-xs px-2.5">
              <div className="flex justify-between items-baseline text-[#647777]">
                <span className="font-medium text-[#647777]">Taxable Amount</span>
                <span className="font-bold font-mono text-[#173333]">
                  ₹ {calculatedEstimate.totals.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[#647777]">
                <span className="font-medium text-[#647777]">GST ({calculatedEstimate.totals.gstRate || 3}%)</span>
                <span className="font-bold font-mono text-[#173333]">
                  ₹ {calculatedEstimate.totals.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="bg-[#FFF9EA] rounded-lg px-2.5 py-2 flex items-baseline justify-between gap-1.5 border border-[#ECD9A5]">
              <span className="text-[11px] font-bold text-[#173333] whitespace-nowrap">
                Total Amount (Incl. GST)
              </span>
              <span className="text-sm font-black font-mono text-[#173333] whitespace-nowrap">
                ₹ {calculatedEstimate.totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Amount in Words Commercial Banner */}
      <div className="p-3.5 bg-[#FAF8F2] rounded-xl border border-[#ECD9A5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs break-inside-avoid shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D23] bg-[#ECD9A5]/50 px-2.5 py-0.5 rounded">
            Amount in Words (INR)
          </span>
          <span className="font-bold text-[#0F5C5B] italic text-xs sm:text-[13px]">
            {numberToIndianWords(calculatedEstimate.totals.grandTotal)}
          </span>
        </div>
        <div className="text-[11px] font-mono text-[#647777] shrink-0">
          GSTIN: <strong className="text-[#173333]">27AAAAA0000A1Z5</strong> (State: 27 - Maharashtra)
        </div>
      </div>

      {/* Settlement Configuration and Customer Ledger Balance - Side by Side on Screen, Stacked Full-Width in Print */}
      <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-1 gap-4 print:gap-4 items-stretch break-inside-avoid">
        {/* Left Card: Settlement Configuration */}
        <div className="lg:col-span-7 print:w-full bg-white rounded-xl border border-[#DCE5E3] shadow-xs p-4 print:p-3 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-[#DCE5E3]">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#0F5C5B] text-white flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-[#173333]">Settlement Configuration</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#647777] uppercase tracking-wider">Preset:</span>
                <select
                  value={activePresetValue}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="text-xs font-semibold py-1 px-2 rounded-lg bg-[#FAF9F6] border border-[#DCE5E3] text-[#173333] cursor-pointer print:border-none print:p-0 print:font-bold"
                >
                  <option value="B2B_WITHOUT_MC">B2B - Without MC</option>
                  <option value="B2B_WITH_MC">B2B - With MC</option>
                  <option value="ALL_IN_GOLD">All in Gold (100%)</option>
                  <option value="CUSTOM">Custom / Flexible</option>
                  <option value="FIX">FIX (100% Cash)</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-[#647777] uppercase tracking-wider whitespace-nowrap">
                  Gold Rate
                </span>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    value={unfixGoldRate > 0 ? unfixGoldRate : (Number(goldRate) > 0 ? goldRate : '')}
                    onChange={(e) => setUnfixGoldRate(parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    placeholder={Number(goldRate) > 0 ? String(goldRate) : '0.00'}
                    className="w-20 sm:w-24 text-xs font-mono font-bold bg-white px-2 py-1 rounded-l-lg border border-r-0 border-[#DCE5E3] text-[#173333] text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none print:border-none print:w-auto"
                  />
                  <span className="text-xs bg-gray-50 px-1.5 py-1 border border-[#DCE5E3] rounded-r-lg text-[#647777] font-medium border-l-0 print:border-none print:bg-transparent">
                    /g
                  </span>
                  {unfixGoldRate > 0 && unfixGoldRate !== Number(goldRate) ? (
                    <button
                      type="button"
                      title="Reset to invoice gold rate"
                      onClick={() => setUnfixGoldRate(0)}
                      className="ml-1 p-1 rounded hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer no-print"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="ml-1 p-1 text-[#647777] no-print">
                      <Pencil className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto touch-scroll print:overflow-visible">
            <table className="w-full min-w-[560px] print:min-w-0 print:w-full text-left text-xs border-collapse print:table-fixed">
              <thead>
                <tr className="border-b border-[#DCE5E3] text-[10px] font-bold uppercase tracking-wider text-[#647777] bg-gray-50/50">
                  <th className="py-2.5 px-3 min-w-[140px] print:min-w-0 print:w-[32%]">COMPONENT</th>
                  <th className="py-2.5 px-3 min-w-[130px] print:min-w-0 print:w-[24%]">SETTLEMENT MODE</th>
                  <th className="py-2.5 px-3 text-right min-w-[95px] print:min-w-0 print:w-[20%] whitespace-nowrap">GOLD WT (g)</th>
                  <th className="py-2.5 px-3 text-right min-w-[125px] print:min-w-0 print:w-[24%] whitespace-nowrap">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5E3]/60 font-medium">
                {/* 1. Gold Metal Value */}
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-[#173333]">Gold Metal Value</td>
                  <td className="py-2 px-3">
                    <select
                      value={currentMetalMode}
                      onChange={(e) => updateCustomRow('goldMetalMode', e.target.value)}
                      className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                    >
                      <option value="GOLD">In Gold (100%)</option>
                      <option value="CASH">In Cash (100%)</option>
                      <option value="SPLIT">Split (Grams / Cash)</option>
                    </select>

                    {currentMetalMode === 'SPLIT' && (
                      <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 space-y-1.5 max-w-sm">
                        <span className="text-[10px] font-bold text-amber-900 block uppercase">
                          Split Settlement (Enter Wt or ₹):
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-[#647777] block font-bold">Gold Wt to Pay (g):</label>
                            <input
                              type="number"
                              step="0.001"
                              value={customSettlement.goldPaidInMetalGrams || ''}
                              placeholder="0.000"
                              onChange={(e) => {
                                const g = parseFloat(e.target.value) || 0;
                                const amt = Number((g * effectiveGoldRate).toFixed(2));
                                setSettlementMode('UNFIX');
                                setUnfixPreset('CUSTOM');
                                setCustomSettlement((prev) => ({
                                  ...prev,
                                  goldMetalMode: 'SPLIT',
                                  goldPaidInMetalGrams: g,
                                  goldPaidInCashAmount: amt,
                                }));
                              }}
                              className="w-full text-xs font-mono font-bold py-1 px-1.5 bg-white rounded border border-amber-300 text-amber-900 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-[#647777] block font-bold">Gold ₹ to Pay:</label>
                            <input
                              type="number"
                              step="1"
                              value={customSettlement.goldPaidInCashAmount || ''}
                              placeholder="0.00"
                              onChange={(e) => {
                                const amt = parseFloat(e.target.value) || 0;
                                const g = Number((amt / effectiveGoldRate).toFixed(3));
                                setSettlementMode('UNFIX');
                                setUnfixPreset('CUSTOM');
                                setCustomSettlement((prev) => ({
                                  ...prev,
                                  goldMetalMode: 'SPLIT',
                                  goldPaidInCashAmount: amt,
                                  goldPaidInMetalGrams: g,
                                }));
                              }}
                              className="w-full text-xs font-mono font-bold py-1 px-1.5 bg-white rounded border border-amber-300 text-amber-900 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    {currentMetalMode === 'GOLD'
                      ? goldPureToAdjust.toFixed(3)
                      : currentMetalMode === 'SPLIT'
                      ? (customSettlement.goldPaidInMetalGrams || 0).toFixed(3)
                      : '0.000'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    ₹ {goldMetalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 2. Gold GST (3%) */}
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-[#173333]">Gold GST (3%)</td>
                  <td className="py-2 px-3">
                    <select
                      value={currentGoldGstMode}
                      onChange={(e) => updateCustomRow('goldGSTMode', e.target.value)}
                      className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                    >
                      <option value="GOLD">In Gold</option>
                      <option value="CASH">In Cash</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    {currentGoldGstMode === 'GOLD' ? goldGstGrams.toFixed(3) : '0.000'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    ₹ {goldGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 3. Making Charges */}
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-[#173333]">Making Charges</td>
                  <td className="py-2 px-3">
                    <select
                      value={currentMcMode}
                      onChange={(e) => updateCustomRow('mcMode', e.target.value)}
                      className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                    >
                      <option value="CASH">In Cash</option>
                      <option value="GOLD">In Gold</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    {currentMcMode === 'GOLD' ? mcGrams.toFixed(3) : '0.000'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    ₹ {mcValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 4. Stones / Diamonds */}
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-[#173333]">Stones / Diamonds</td>
                  <td className="py-2 px-3">
                    <select
                      value={currentStonesMode}
                      onChange={(e) => updateCustomRow('stonesMode', e.target.value)}
                      className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                    >
                      <option value="CASH">In Cash</option>
                      <option value="GOLD">In Gold</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    {currentStonesMode === 'GOLD' ? stonesGrams.toFixed(3) : '0.000'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    ₹ {stonesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* 5. Additional Expenses */}
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-[#173333]">Additional Expenses</span>
                      <button
                        type="button"
                        onClick={() => setShowExpensesSection(!showExpensesSection)}
                        className="text-[10px] text-[#0F5C5B] font-bold hover:underline cursor-pointer flex items-center gap-1 bg-[#0F5C5B]/5 px-1.5 py-0.5 rounded border border-[#0F5C5B]/20"
                      >
                        <span>{expensesTotal > 0 ? `₹${expensesTotal}` : '+ Add'}</span>
                        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showExpensesSection ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={currentExpensesMode}
                      onChange={(e) => updateCustomRow('expensesMode', e.target.value)}
                      className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                    >
                      <option value="CASH">In Cash</option>
                      <option value="GOLD">In Gold</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    {currentExpensesMode === 'GOLD' ? expensesGrams.toFixed(3) : '0.000'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    ₹ {expensesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Expandable Additional Expenses Inputs */}
                {showExpensesSection && (
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="p-3 border-t border-b border-[#DCE5E3]">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                        <SBGInput
                          label="HUID Charges (₹)"
                          type="number"
                          step="1"
                          placeholder="0.00"
                          value={huidCharges || ''}
                          onChange={(e) => setHuidCharges(parseFloat(e.target.value) || 0)}
                        />
                        <SBGInput
                          label="Courier (₹)"
                          type="number"
                          step="1"
                          placeholder="0.00"
                          value={courierCharges || ''}
                          onChange={(e) => setCourierCharges(parseFloat(e.target.value) || 0)}
                        />
                        <SBGInput
                          label="Other Charges (₹)"
                          type="number"
                          step="1"
                          placeholder="0.00"
                          value={otherCharges || ''}
                          onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                        />
                        <SBGInput
                          label="Remarks"
                          type="text"
                          placeholder="e.g. Hallmarking"
                          value={otherChargesRemarks}
                          onChange={(e) => setOtherChargesRemarks(e.target.value)}
                        />
                      </div>
                    </td>
                  </tr>
                )}

                {/* 6. Other GST (3%) */}
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-[#173333]">Other GST (3%)</td>
                  <td className="py-2 px-3">
                    <select
                      value={currentOtherGstMode}
                      onChange={(e) => updateCustomRow('otherGstMode', e.target.value)}
                      className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                    >
                      <option value="CASH">In Cash</option>
                      <option value="GOLD">In Gold</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    {currentOtherGstMode === 'GOLD' ? otherGstGrams.toFixed(3) : '0.000'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#173333] whitespace-nowrap">
                    ₹ {otherGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#DCE5E3] bg-[#FAF9F5] font-bold">
                  <td className="py-2.5 px-3 text-[#173333] font-bold text-xs" colSpan={2}>
                    Total to Settle
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-[#173333] whitespace-nowrap">
                    {settledGoldWT.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-[#173333] whitespace-nowrap">
                    ₹ {settledCashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right Card: Customer Ledger Balance Adjustment */}
        <div className="lg:col-span-5 print:w-full bg-white rounded-xl border border-[#DCE5E3] shadow-xs p-4 print:p-3 flex flex-col justify-between space-y-3">
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#DCE5E3]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0F5C5B] text-white flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-[#173333]">Customer Ledger Balance Adjustment</span>
              </div>

              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-[#647777] text-[11px]">
                  Account: <strong className="text-[#173333] font-bold">{selectedCustomer?.name || 'Customer'} ({selectedCustomer?.code || 'ACC'})</strong>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isPurchase ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-[#E6F4F1] text-[#0F5C5B] border border-[#0F5C5B]/20'
                }`}>
                  {isPurchase ? 'Purchase (Receipt −)' : 'Sale (Issue +)'}
                </span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-hidden rounded-xl border border-[#DCE5E3] bg-white my-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE5E3] text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3.5 text-[#647777] bg-gray-50/70 w-[36%]">
                      BALANCE RECORD
                    </th>
                    <th className="py-2.5 px-3 bg-[#FFF8EA] text-[#8C6A23] w-[30%] border-l border-[#ECD9A5] text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>PURE GOLD (g)</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 bg-[#E6F4F1] text-[#0F5C5B] w-[34%] border-l border-[#B7E4D9] text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold">
                        <Scale className="w-3.5 h-3.5 text-[#0F5C5B]" />
                        <span>CASH (₹)</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5E3]/60 font-medium">
                  {/* Row 1: Previous Balance */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-3.5 text-[#173333] font-semibold">
                      Previous Balance
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-xs text-[#173333] border-l border-[#DCE5E3]/60 whitespace-nowrap">
                      {currentWT < 0 ? '−' : currentWT > 0 ? '+' : ''}{Math.abs(currentWT).toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right pr-4 font-mono font-bold text-xs text-[#173333] border-l border-[#DCE5E3]/60 whitespace-nowrap">
                      {currentMC < 0 ? '− ₹ ' : currentMC > 0 ? '+ ₹ ' : '₹ '}{Math.abs(currentMC).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Row 2: Estimate Impact */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-3.5 text-[#173333] font-semibold">
                      Estimate Impact ({isPurchase ? '−' : '+'})
                    </td>
                    <td className={`py-3 px-3 text-center font-mono font-bold text-xs border-l border-[#DCE5E3]/60 whitespace-nowrap ${isPurchase ? 'text-rose-600' : 'text-[#0F5C5B]'}`}>
                      {displayDeltaPureWT >= 0 ? '+' : '−'}{Math.abs(displayDeltaPureWT).toFixed(3)}
                    </td>
                    <td className={`py-3 px-3 text-right pr-4 font-mono font-bold text-xs border-l border-[#DCE5E3]/60 whitespace-nowrap ${isPurchase ? 'text-rose-600' : 'text-[#0F5C5B]'}`}>
                      {displayDeltaAmount >= 0 ? '+ ₹ ' : '− ₹ '}{Math.abs(displayDeltaAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Row 3: New Balance (Hero Highlight Row) */}
                  <tr className="bg-[#FFF8EA] border-t-2 border-[#D9B76C]/40">
                    <td className="py-3.5 px-3.5 font-black text-sm text-[#173333]">
                      New Balance
                    </td>
                    <td className={`py-3.5 px-3 text-center font-mono font-black text-base border-l border-[#DCE5E3]/60 whitespace-nowrap ${newBalWT < 0 ? 'text-rose-600' : 'text-[#0F5C5B]'}`}>
                      {newBalWT < 0 ? '−' : newBalWT > 0 ? '+' : ''}{Math.abs(newBalWT).toFixed(3)}
                    </td>
                    <td className={`py-3.5 px-3 text-right pr-4 font-mono font-black text-base border-l border-[#DCE5E3]/60 whitespace-nowrap ${newBalMC < 0 ? 'text-rose-600' : 'text-[#0F5C5B]'}`}>
                      {newBalMC < 0 ? '− ₹ ' : newBalMC > 0 ? '+ ₹ ' : '₹ '}{Math.abs(newBalMC).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Status Verification Footer */}
            <div className="pt-2.5 border-t border-[#DCE5E3]/70 flex items-center justify-between text-[11px] text-[#647777]">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#1A825B]"></span>
                <span>Ledger Impact: <strong className="text-[#173333]">{isPurchase ? 'Negative Adjustment (−)' : 'Positive Adjustment (+)'}</strong></span>
              </div>
              <span className="text-[10px] font-mono text-[#8C6D23] font-bold bg-[#FFF8EA] px-2 py-0.5 rounded border border-[#ECD9A5]/60">
                Dual-Ledger Sync
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Actions Bar (Screen Only - Convenient for Mobile) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 p-4 bg-white border border-[#DCE5E3] rounded-2xl shadow-xs no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="px-3.5 py-2 rounded-xl border border-[#DCE5E3] bg-white text-xs font-semibold text-[#173333] hover:bg-gray-50 shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5 text-[#0F5C5B]" /> Print
        </button>
        <button
          type="button"
          onClick={() => onNavigate('estimates')}
          className="px-3.5 py-2 rounded-xl border border-[#DCE5E3] bg-white text-xs font-semibold text-[#173333] hover:bg-gray-50 shadow-xs cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveEstimate}
          className="px-3.5 py-2 rounded-xl border border-[#DCE5E3] bg-white text-xs font-semibold text-[#173333] hover:bg-gray-50 shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5 text-[#647777]" /> Save Draft
        </button>
        <button
          type="button"
          onClick={handleSaveAndConfirmEstimate}
          className="px-4 py-2 rounded-xl bg-[#0F5C5B] text-xs font-bold text-white hover:bg-[#0c4a49] shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <FileCheck className="w-3.5 h-3.5" /> Save & Confirm to Ledger
        </button>
      </div>

      {/* Commercial Print Footer (Visible Only When Printing) */}
      <div className="hidden print:block pt-4 border-t-2 border-[#0F5C5B]/20 break-inside-avoid space-y-4">
        {/* Bank Details & Terms Grid for Print */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          {/* Left Box: Bank Details for Settlement */}
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#ECD9A5]/70 space-y-1 text-[11px] print:text-[9px]">
            <span className="font-bold text-[#0F5C5B] uppercase tracking-wide flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#D9B76C]" />
              Bank Details for Electronic Settlement (RTGS / NEFT)
            </span>
            <div className="grid grid-cols-2 gap-x-2 pt-0.5 text-[#173333] font-mono">
              <div><span className="text-[#647777] font-sans">A/C Name:</span> <strong>SREE BALAJI GOLD</strong></div>
              <div><span className="text-[#647777] font-sans">Bank:</span> <strong>HDFC Bank</strong></div>
              <div><span className="text-[#647777] font-sans">A/C No:</span> <strong>50200088992211</strong></div>
              <div><span className="text-[#647777] font-sans">IFSC:</span> <strong>HDFC0000123</strong></div>
            </div>
          </div>

          {/* Right Box: Commercial Terms */}
          <div className="p-3 bg-gray-50 rounded-xl border border-[#DCE5E3] space-y-1 text-[10px] print:text-[8.5px] text-[#647777]">
            <span className="font-bold text-[#173333] uppercase tracking-wide block">
              Terms & Conditions
            </span>
            <p>1. Metal purity & fine gold weight certified benchmarked against 99.9% 24K bullion.</p>
            <p>2. Confirmed estimates post directly to the customer GC Account and Cash Ledger.</p>
            <p>3. Disputes subject to Mumbai / local commercial jurisdiction.</p>
          </div>
        </div>

        {/* Signature Blocks */}
        <div className="grid grid-cols-2 gap-8 items-end pt-2 text-xs">
          <div className="space-y-10 text-center">
            <div className="text-[10px] print:text-[9px] text-[#647777] font-medium">
              Customer Confirmation & Acceptance
            </div>
            <div className="border-t border-[#173333]/50 pt-1.5 mx-auto w-48 text-center text-[10px] print:text-[9px] font-semibold text-[#173333]">
              Receiver / Customer's Signature
            </div>
          </div>

          <div className="space-y-10 text-center">
            <div className="text-[10px] print:text-[9px] text-[#647777] font-medium">
              For <strong className="text-[#0F5C5B] font-bold">SREE BALAJI GOLD</strong>
            </div>
            <div className="border-t border-[#173333]/50 pt-1.5 mx-auto w-52 text-center text-[10px] print:text-[9px] font-bold text-[#0F5C5B]">
              Authorized Signatory & Stamp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
