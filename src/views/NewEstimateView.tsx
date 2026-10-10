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
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calculator,
  Scale,
  FileCheck,
  Wallet,
  Gem,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Layers,
  Coins,
  Truck,
  ShieldCheck,
  Sliders,
  Info,
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
  const existingEstimate = targetId ? estimates.find((e) => e.id === targetId) : undefined;
  const isEditing = Boolean(isEditMode || existingEstimate);

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
  const [estimateNo, setEstimateNo] = useState(
    existingEstimate?.estimateNo || `EST-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [estimateDate, setEstimateDate] = useState(
    existingEstimate?.estimateDate || new Date().toISOString().split('T')[0]
  );
  const [customerRef, setCustomerRef] = useState(existingEstimate?.customerRef || '');
  const [touchFixed, setTouchFixed] = useState(existingEstimate?.touchFixed ?? true);
  const [isGold, setIsGold] = useState(existingEstimate?.isGold ?? true);
  const [goldRate, setGoldRate] = useState<number>(existingEstimate?.goldRate || goldMarketRate);
  const [goldRatePurity, setGoldRatePurity] = useState<number>(existingEstimate?.goldRatePurity || 99.5);
  const [diamondRate, setDiamondRate] = useState<number>(existingEstimate?.diamondRate || 45000);
  const [stoneRate, setStoneRate] = useState<number>(existingEstimate?.stoneRate || 1200);
  const [mcRate, setMcRate] = useState<number>(existingEstimate?.mcRate || 950);
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

  // Load existing line items or fresh defaults
  const [items, setItems] = useState<Partial<EstimateLineItem>[]>(() => {
    if (existingEstimate && existingEstimate.items && existingEstimate.items.length > 0) {
      return existingEstimate.items;
    }
    return [
      {
        id: `line-${Date.now()}-1`,
        sl: 1,
        item: '22ct Gold Handcrafted Ornament',
        category: 'GOLD',
        nos: 1,
        grossWT: 12.500,
        stoneWT: 0.500,
        touch: 91.6,
        rate: goldMarketRate,
        rateUnit: 'PER_G',
      },
      {
        id: `line-${Date.now()}-2`,
        sl: 2,
        item: 'Craftsmanship & Making Charge',
        category: 'MAKING_CHARGE',
        nos: 1,
        grossWT: 0,
        stoneWT: 0,
        touch: 0,
        rate: 950.0,
        rateUnit: 'PER_G',
      },
    ];
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
      setGoldRatePurity(existingEstimate.goldRatePurity || 99.5);
      setDiamondRate(existingEstimate.diamondRate || 45000);
      setStoneRate(existingEstimate.stoneRate || 1200);
      setMcRate(existingEstimate.mcRate || 950);
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

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerOrders = orders.filter((o) => o.customerId === customerId);

  // Live Calculated Estimate via Calculation Engine
  const calculatedEstimate = calculateEstimateSheet(
    {
      id: existingEstimate ? existingEstimate.id : `est-${Date.now()}`,
      estimateNo,
      estimateDate,
      customerId,
      customerName: selectedCustomer?.name,
      orderId: orderId || undefined,
      customerRef,
      touchFixed,
      isGold,
      goldRate,
      goldRatePurity,
      diamondRate,
      stoneRate,
      mcRate,
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
    setItems((prev) =>
      prev.map((item) => {
        let rate = item.rate || 0;
        let rateUnit: RateUnit = item.rateUnit || 'PER_G';

        if (item.category === 'GOLD') {
          rate = goldRate;
          rateUnit = 'PER_G';
        } else if (item.category === 'DIAMOND') {
          rate = diamondRate;
          rateUnit = 'PER_CT';
        } else if (item.category === 'PRECIOUS_STONE') {
          rate = stoneRate;
          rateUnit = 'PER_CT';
        } else if (item.category === 'MAKING_CHARGE') {
          rate = mcRate;
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
    let defaultRate = goldRate;
    let defaultUnit: RateUnit = 'PER_G';

    if (category === 'DIAMOND') {
      defaultRate = diamondRate;
      defaultUnit = 'PER_CT';
    } else if (category === 'PRECIOUS_STONE') {
      defaultRate = stoneRate;
      defaultUnit = 'PER_CT';
    } else if (category === 'MAKING_CHARGE') {
      defaultRate = mcRate;
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
        stoneWTUnit: category === 'DIAMOND' || category === 'PRECIOUS_STONE' ? 'ct' : 'g',
        touch: category === 'GOLD' ? 91.6 : 0,
        rate: defaultRate,
        rateUnit: defaultUnit,
      },
    ]);
  };

  const handleDeleteLine = (index: number) => {
    if (items.length <= 1) return;
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
  const [expandedSubItems, setExpandedSubItems] = useState<Record<string, boolean>>({
    'item-1': true,
    'item-2': true,
  });

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
    const defaultRate =
      preset?.rate ??
      (defaultCategory === 'GOLD'
        ? goldRate
        : defaultCategory === 'DIAMOND'
        ? diamondRate
        : defaultCategory === 'PRECIOUS_STONE'
        ? stoneRate
        : defaultCategory === 'MAKING_CHARGE'
        ? mcRate
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
      await confirmEstimate(existingEstimate.id);
    } else {
      await addEstimate(estimateToSave);
      await confirmEstimate(estId);
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

  return (
    <div className="space-y-6">
      {/* Top Navigation & Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('estimates')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0F5C5B] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Estimates List
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <SBGButton
            variant="outline"
            size="sm"
            onClick={() => onNavigate('estimates')}
          >
            Cancel
          </SBGButton>

          {isEditing && (
            <SBGButton
              variant="secondary"
              size="sm"
              icon={<Copy className="w-4 h-4" />}
              onClick={handleSaveAsNewCopy}
            >
              Save as New Copy
            </SBGButton>
          )}

          <SBGButton
            variant="glass"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSaveEstimate}
          >
            {isEditing ? 'Save as Draft' : 'Save Draft'}
          </SBGButton>

          <SBGButton
            variant="primary"
            size="sm"
            icon={<FileCheck className="w-4 h-4" />}
            onClick={handleSaveAndConfirmEstimate}
          >
            Save & Confirm to Ledger
          </SBGButton>
        </div>
      </div>

      {/* Header Parameters Card */}
      <SBGCard variant="glass" className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#DCE5E3] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F5C5B]/10 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-[#0F5C5B]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F5C5B]">
                {isEditing ? 'Edit & Re-Update Costing Sheet' : 'SBG Estimate Cost Sheet Generator'}
              </h2>
              <p className="text-[11px] text-[#647777]">
                {isEditing
                  ? `Editing live sheet parameters and line items for ${estimateNo}`
                  : 'Multi-tier dynamic item rates, making charge formulas, and automatic balance reconciliation'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#D9B76C] bg-[#D9B76C]/15 px-3 py-1.5 rounded-lg border border-[#D9B76C]/30">
            {estimateNo}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <SBGSelect
            label="Customer Account"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            options={customers.map((c) => ({
              label: `${c.name} (${c.code})`,
              value: c.id,
            }))}
            required
          />

          <SBGSelect
            label="Commercial Order Ref"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            options={[
              { label: '-- General Estimate (No Order) --', value: '' },
              ...customerOrders.map((o) => ({
                label: `${o.orderNo} - ${o.reference}`,
                value: o.id,
              })),
            ]}
          />

          <SBGInput
            label="Estimate Date"
            type="date"
            value={estimateDate}
            onChange={(e) => setEstimateDate(e.target.value)}
            required
          />

          <SBGInput
            label="Customer Job Reference"
            placeholder="e.g. KVJ-SPEC-01"
            value={customerRef}
            onChange={(e) => setCustomerRef(e.target.value)}
          />
        </div>

        {/* Transaction Nature & Ledger Settlement Controls */}
        <div className="p-4 bg-white/90 rounded-2xl border border-[#DCE5E3] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#0F5C5B] block mb-1.5">
                Estimate Nature / Transaction Type
              </label>
              <div className="flex rounded-xl bg-[#0F5C5B]/5 p-1 border border-[#DCE5E3]">
                <button
                  type="button"
                  onClick={() => setTransactionType('PURCHASE')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    transactionType === 'PURCHASE'
                      ? 'bg-[#0F5C5B] text-white shadow-xs'
                      : 'text-[#647777] hover:text-[#0F5C5B]'
                  }`}
                >
                  <span>PURCHASE (Receipt −)</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${transactionType === 'PURCHASE' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#647777]'}`}>
                    Negative Adjust
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('SALE')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    transactionType === 'SALE'
                      ? 'bg-[#D9B76C] text-[#173333] shadow-xs'
                      : 'text-[#647777] hover:text-[#0F5C5B]'
                  }`}
                >
                  <span>SALE (Issue +)</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${transactionType === 'SALE' ? 'bg-black/15 text-[#173333]' : 'bg-black/5 text-[#647777]'}`}>
                    Positive Adjust
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-[#526B6A] mt-1.5">
                {transactionType === 'PURCHASE' ? (
                  <span>
                    <strong>Purchase:</strong> Customer supplies ornaments/gold to SBG. Pure Gold WT & charges are adjusted in <strong>Negative (−)</strong> to credit the customer balance.
                  </span>
                ) : (
                  <span>
                    <strong>Sale:</strong> SBG delivers ornaments to customer. Pure Gold WT & charges are adjusted in <strong>Positive (+)</strong> to debit the customer balance.
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#0F5C5B] block mb-1.5">
                Ledger Balance Settlement Mode
              </label>
              <div className="flex rounded-xl bg-[#0F5C5B]/5 p-1 border border-[#DCE5E3]">
                <button
                  type="button"
                  onClick={() => setSettlementMode('UNFIX')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    settlementMode === 'UNFIX' || settlementMode === 'GOLD_AND_CASH'
                      ? 'bg-[#0F5C5B] text-white shadow-xs'
                      : 'text-[#647777] hover:text-[#0F5C5B]'
                  }`}
                >
                  <span>⚖️ UNFIX (Metal & B2B)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettlementMode('FIX')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    settlementMode === 'FIX' || settlementMode === 'CASH_ONLY'
                      ? 'bg-[#0F5C5B] text-white shadow-xs'
                      : 'text-[#647777] hover:text-[#0F5C5B]'
                  }`}
                >
                  <span>🔒 FIX (100% Cash)</span>
                </button>
              </div>
              <p className="text-[11px] text-[#526B6A] mt-1.5">
                {settlementMode === 'FIX' || settlementMode === 'CASH_ONLY' ? (
                  <span>
                    <strong>Fix Mode:</strong> Entire estimate (<SBGCurrency value={calculatedEstimate.totals.grandTotal} />) settled in Cash. Customer Gold Balance is untouched (0.000g).
                  </span>
                ) : (
                  <span>
                    <strong>Unfix Mode:</strong> Customer pays pure gold weight in Gold, and non-metal charges in Cash or Gold based on B2B preset.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* UNFIX Options & B2B Settlement Presets */}
          {(settlementMode === 'UNFIX' || settlementMode === 'GOLD_AND_CASH') && (
            <div className="pt-3 border-t border-[#DCE5E3] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#D9B76C]" /> Select B2B Unfix Settlement Type:
                </span>
                <span className="text-[11px] text-[#647777]">
                  Click one preset below to automatically distribute between Gold grams & Cash rupees:
                </span>
              </div>

              {/* 4 Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. B2B - Without MC */}
                <button
                  type="button"
                  onClick={() => setUnfixPreset('B2B_WITHOUT_MC')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    unfixPreset === 'B2B_WITHOUT_MC'
                      ? 'bg-[#0F5C5B]/10 border-[#0F5C5B] ring-2 ring-[#0F5C5B]/20 shadow-xs'
                      : 'bg-white hover:bg-[#F9FBFA] border-[#DCE5E3]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F5C5B]">B2B - Without MC</span>
                      {unfixPreset === 'B2B_WITHOUT_MC' && (
                        <span className="w-2 h-2 rounded-full bg-[#0F5C5B]" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#647777] block mt-1">
                      Most common wholesaler settlement
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] font-mono space-y-0.5 border-t border-[#DCE5E3]/60 pt-1.5">
                    <div className="text-[#0F5C5B] font-semibold">🪙 Gold & Gold GST: in Gold</div>
                    <div className="text-[#8C6A23]">💵 MC & Other: in Cash</div>
                  </div>
                </button>

                {/* 2. B2B - With MC */}
                <button
                  type="button"
                  onClick={() => setUnfixPreset('B2B_WITH_MC')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    unfixPreset === 'B2B_WITH_MC'
                      ? 'bg-[#0F5C5B]/10 border-[#0F5C5B] ring-2 ring-[#0F5C5B]/20 shadow-xs'
                      : 'bg-white hover:bg-[#F9FBFA] border-[#DCE5E3]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F5C5B]">B2B - With MC</span>
                      {unfixPreset === 'B2B_WITH_MC' && (
                        <span className="w-2 h-2 rounded-full bg-[#0F5C5B]" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#647777] block mt-1">
                      Making charges converted to gold
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] font-mono space-y-0.5 border-t border-[#DCE5E3]/60 pt-1.5">
                    <div className="text-[#0F5C5B] font-semibold">🪙 Gold, GST & MC: in Gold</div>
                    <div className="text-[#8C6A23]">💵 Stones & Exp: in Cash</div>
                  </div>
                </button>

                {/* 3. All in Gold */}
                <button
                  type="button"
                  onClick={() => setUnfixPreset('ALL_IN_GOLD')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    unfixPreset === 'ALL_IN_GOLD'
                      ? 'bg-[#D9B76C]/15 border-[#D9B76C] ring-2 ring-[#D9B76C]/30 shadow-xs'
                      : 'bg-white hover:bg-[#F9FBFA] border-[#DCE5E3]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8C6A23]">All in Gold (100%)</span>
                      {unfixPreset === 'ALL_IN_GOLD' && (
                        <span className="w-2 h-2 rounded-full bg-[#D9B76C]" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#647777] block mt-1">
                      Entire estimate paid in pure gold
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] font-mono space-y-0.5 border-t border-[#DCE5E3]/60 pt-1.5">
                    <div className="text-[#0F5C5B] font-semibold">🪙 100% of Bill: in Gold</div>
                    <div className="text-[#2E8B57] font-bold">💵 Cash Amount: ₹0.00</div>
                  </div>
                </button>

                {/* 4. Custom & Split Gold */}
                <button
                  type="button"
                  onClick={() => setUnfixPreset('CUSTOM')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    unfixPreset === 'CUSTOM'
                      ? 'bg-[#0F5C5B]/10 border-[#0F5C5B] ring-2 ring-[#0F5C5B]/20 shadow-xs'
                      : 'bg-white hover:bg-[#F9FBFA] border-[#DCE5E3]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F5C5B]">Custom & Split Gold</span>
                      {unfixPreset === 'CUSTOM' && (
                        <span className="w-2 h-2 rounded-full bg-[#0F5C5B]" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#647777] block mt-1">
                      Pay part gold metal + part cash
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] font-mono space-y-0.5 border-t border-[#DCE5E3]/60 pt-1.5">
                    <div className="text-[#0F5C5B] font-semibold">⚙️ Custom item toggles</div>
                    <div className="text-[#647777]">⚖️ Split Gold Weight option</div>
                  </div>
                </button>
              </div>

              {/* Custom & Split Gold Options Drawer */}
              {unfixPreset === 'CUSTOM' && (
                <div className="p-3.5 bg-[#0F5C5B]/5 rounded-xl border border-[#0F5C5B]/20 space-y-3">
                  <div className="text-xs font-bold text-[#0F5C5B] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" /> Custom Settlement Configuration:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Metal Settlement Choice */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-[#647777]">
                        Gold Metal Value ({(calculatedEstimate.totals.goldPureWT ?? calculatedEstimate.totals.totalPureWT).toFixed(3)}g)
                      </label>
                      <select
                        value={customSettlement.goldMetalMode}
                        onChange={(e) =>
                          setCustomSettlement((prev) => ({
                            ...prev,
                            goldMetalMode: e.target.value as any,
                          }))
                        }
                        className="w-full text-xs font-medium py-1.5 px-2 rounded-lg bg-white border border-[#DCE5E3]"
                      >
                        <option value="GOLD">🪙 Pay 100% in Pure Gold (g)</option>
                        <option value="CASH">💵 Pay 100% in Cash (₹)</option>
                        <option value="SPLIT">⚖️ Split: Part Gold Metal + Part Cash</option>
                      </select>
                    </div>

                    {/* Split Gold Input */}
                    {customSettlement.goldMetalMode === 'SPLIT' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#0F5C5B]">
                          Physical Gold Weight to Pay (g)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          placeholder="e.g. 10.000"
                          value={customSettlement.goldPaidInMetalGrams || ''}
                          onChange={(e) =>
                            setCustomSettlement((prev) => ({
                              ...prev,
                              goldPaidInMetalGrams: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full text-xs font-mono font-bold py-1.5 px-2 rounded-lg bg-white border border-[#0F5C5B] text-[#0F5C5B]"
                        />
                      </div>
                    )}

                    {/* Gold GST Toggle */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-[#647777]">
                        Gold GST Settlement
                      </label>
                      <select
                        value={customSettlement.goldGSTMode}
                        onChange={(e) =>
                          setCustomSettlement((prev) => ({
                            ...prev,
                            goldGSTMode: e.target.value as any,
                          }))
                        }
                        className="w-full text-xs font-medium py-1.5 px-2 rounded-lg bg-white border border-[#DCE5E3]"
                      >
                        <option value="GOLD">🪙 Pay in Gold (g)</option>
                        <option value="CASH">💵 Pay in Cash (₹)</option>
                      </select>
                    </div>

                    {/* Making Charges Toggle */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-[#647777]">
                        Making Charges (MC) Settlement
                      </label>
                      <select
                        value={customSettlement.mcMode}
                        onChange={(e) =>
                          setCustomSettlement((prev) => ({
                            ...prev,
                            mcMode: e.target.value as any,
                          }))
                        }
                        className="w-full text-xs font-medium py-1.5 px-2 rounded-lg bg-white border border-[#DCE5E3]"
                      >
                        <option value="CASH">💵 Pay in Cash (₹)</option>
                        <option value="GOLD">🪙 Pay in Gold (g)</option>
                      </select>
                    </div>

                    {/* Diamonds & Stones Toggle */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-[#647777]">
                        Stones & Diamonds Settlement
                      </label>
                      <select
                        value={customSettlement.stonesMode}
                        onChange={(e) =>
                          setCustomSettlement((prev) => ({
                            ...prev,
                            stonesMode: e.target.value as any,
                          }))
                        }
                        className="w-full text-xs font-medium py-1.5 px-2 rounded-lg bg-white border border-[#DCE5E3]"
                      >
                        <option value="CASH">💵 Pay in Cash (₹)</option>
                        <option value="GOLD">🪙 Pay in Gold (g)</option>
                      </select>
                    </div>

                    {/* Additional Expenses Toggle */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-[#647777]">
                        Additional Company Expenses
                      </label>
                      <select
                        value={customSettlement.expensesMode}
                        onChange={(e) =>
                          setCustomSettlement((prev) => ({
                            ...prev,
                            expensesMode: e.target.value as any,
                          }))
                        }
                        className="w-full text-xs font-medium py-1.5 px-2 rounded-lg bg-white border border-[#DCE5E3]"
                      >
                        <option value="CASH">💵 Pay in Cash (₹)</option>
                        <option value="GOLD">🪙 Pay in Gold (g)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Company Expenses Section */}
          <div className="pt-3 border-t border-[#DCE5E3]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowExpensesSection(!showExpensesSection)}
                className="text-xs font-bold text-[#0F5C5B] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-[#D9B76C]" />
                <span>Additional Company Expenses (HUID, Courier, Misc)</span>
                <span className="text-[10px] text-[#647777] font-normal">
                  {showExpensesSection ? '(Click to collapse)' : '(Click to add)'}
                </span>
              </button>
              {(huidCharges > 0 || courierCharges > 0 || otherCharges > 0) && (
                <span className="text-xs font-mono font-bold text-[#0F5C5B]">
                  Total Expenses: <SBGCurrency value={huidCharges + courierCharges + otherCharges} />
                </span>
              )}
            </div>

            {showExpensesSection && (
              <div className="mt-3 p-3 bg-gray-50/70 rounded-xl border border-[#DCE5E3] grid grid-cols-1 sm:grid-cols-4 gap-3">
                <SBGInput
                  label="HUID Charges (₹)"
                  type="number"
                  step="1"
                  placeholder="0.00"
                  value={huidCharges || ''}
                  onChange={(e) => setHuidCharges(parseFloat(e.target.value) || 0)}
                />
                <SBGInput
                  label="Courier / Freight (₹)"
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
                  label="Other Charges Remarks"
                  type="text"
                  placeholder="e.g. Hallmarking, Insurance"
                  value={otherChargesRemarks}
                  onChange={(e) => setOtherChargesRemarks(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Live Ledger Settlement Impact Summary Banner */}
          <div className="p-3.5 bg-gradient-to-r from-[#0F5C5B]/10 via-[#0F5C5B]/5 to-[#D9B76C]/10 rounded-xl border border-[#0F5C5B]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#647777] block">
                Live Settlement Distribution
              </span>
              <div className="font-semibold text-[#173333] flex flex-wrap items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1.5 font-mono font-bold text-[#0F5C5B] bg-white/80 px-2.5 py-1 rounded-lg border border-[#0F5C5B]/20">
                  <Coins className="w-3.5 h-3.5 text-[#D9B76C]" /> Pure Gold to Settle:{' '}
                  <span className="text-sm">{(calculatedEstimate.totals.settledGoldWT ?? 0).toFixed(3)} g</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono font-bold text-[#8C6A23] bg-white/80 px-2.5 py-1 rounded-lg border border-[#D9B76C]/30">
                  <Wallet className="w-3.5 h-3.5 text-[#8C6A23]" /> Cash to Settle:{' '}
                  <span className="text-sm"><SBGCurrency value={calculatedEstimate.totals.settledCashAmount ?? 0} /></span>
                </span>
              </div>
            </div>
            <div className="text-[11px] text-[#526B6A] font-medium sm:text-right">
              {transactionType === 'PURCHASE' ? (
                <span>Crediting customer balance (Negative −)</span>
              ) : (
                <span>Debiting customer balance (Positive +)</span>
              )}
            </div>
          </div>
        </div>

        {/* Master Rate Matrix Control Bar */}
        <div className="p-4 bg-gradient-to-r from-[#0F5C5B]/10 via-[#0F5C5B]/5 to-transparent rounded-2xl border border-[#0F5C5B]/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D9B76C]" /> Estimate Master Rates Matrix
              </h3>
              <p className="text-[11px] text-[#647777]">
                Define base rates for Gold, Diamonds, Stones, and Making Charges. Click button to apply to all lines dynamically.
              </p>
            </div>

            <SBGButton
              variant="gold"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={handleApplyMasterRatesToAllLines}
            >
              Apply Master Rates to All Lines
            </SBGButton>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <SBGInput
              label="Master Gold Rate (₹/g)"
              type="number"
              step="0.01"
              value={goldRate}
              onChange={(e) => setGoldRate(parseFloat(e.target.value) || 0)}
            />
            <SBGInput
              label="Master Diamond Rate (₹/ct)"
              type="number"
              step="1"
              value={diamondRate}
              onChange={(e) => setDiamondRate(parseFloat(e.target.value) || 0)}
            />
            <SBGInput
              label="Master Stone Rate (₹/ct)"
              type="number"
              step="1"
              value={stoneRate}
              onChange={(e) => setStoneRate(parseFloat(e.target.value) || 0)}
            />
            <SBGInput
              label="Master MC Rate (₹/g)"
              type="number"
              step="1"
              value={mcRate}
              onChange={(e) => setMcRate(parseFloat(e.target.value) || 0)}
            />
            <SBGInput
              label="Gold Purity (%)"
              type="number"
              step="0.1"
              suffixText="%"
              value={goldRatePurity}
              onChange={(e) => setGoldRatePurity(parseFloat(e.target.value) || 99.5)}
            />
          </div>
        </div>
      </SBGCard>

      {/* Dynamic Line Items Table */}
      <SBGCard variant="glass" className="p-0 overflow-hidden space-y-4">
        <div className="p-4 bg-[#0F5C5B]/5 border-b border-[#DCE5E3] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F5C5B]">Dynamic Estimate Line Items</h3>
            <p className="text-[11px] text-[#647777]">
              Real-time calculation of Net WT, Pure WT, Rates, and Subtotals
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SBGButton
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => handleAddLine('GOLD')}
            >
              + Gold Line
            </SBGButton>
            <SBGButton
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => handleAddLine('DIAMOND')}
            >
              + Diamond Line
            </SBGButton>
            <SBGButton
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => handleAddLine('PRECIOUS_STONE')}
            >
              + Stone Line
            </SBGButton>
            <SBGButton
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => handleAddLine('MAKING_CHARGE')}
            >
              + MC Line
            </SBGButton>
          </div>
        </div>

        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-left text-xs">
            <thead className="text-[#647777] border-b border-[#DCE5E3] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-2 w-8">#</th>
                <th className="py-2.5 px-2 min-w-[140px]">Item Description</th>
                <th className="py-2.5 px-2 min-w-[110px]">Category</th>
                <th className="py-2.5 px-2 text-right w-16">Nos</th>
                <th className="py-2.5 px-2 text-right w-24">Gross WT (g)</th>
                <th className="py-2.5 px-2 text-right min-w-[130px]">Stone WT</th>
                <th className="py-2.5 px-2 text-right w-20">Net WT</th>
                <th className="py-2.5 px-2 text-right w-20">Touch %</th>
                <th className="py-2.5 px-2 text-right w-20 font-bold text-[#0F5C5B]">Pure WT</th>
                <th className="py-2.5 px-2 text-right min-w-[100px]">Rate (₹)</th>
                <th className="py-2.5 px-2 min-w-[100px]">Unit</th>
                <th className="py-2.5 px-2 text-right font-bold text-[#0F5C5B] min-w-[120px]">Line Amount</th>
                <th className="py-2.5 px-2 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5E3]/60">
              {calculatedEstimate.items.map((line, idx) => {
                const isExpanded = !!expandedSubItems[line.id];
                const subCount = line.subItems?.length || 0;

                return (
                  <React.Fragment key={line.id}>
                    <tr className="hover:bg-white/60">
                      <td className="py-2.5 px-2 font-mono text-[#647777]">{idx + 1}</td>
                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          value={line.item}
                          onChange={(e) => handleUpdateLine(idx, { item: e.target.value })}
                          className="w-full text-xs font-semibold px-2 py-1 bg-white border border-[#DCE5E3] rounded-lg focus:outline-none focus:border-[#0F5C5B]"
                        />
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => toggleSubItems(line.id)}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                              subCount > 0
                                ? 'bg-[#0F5C5B]/10 text-[#0F5C5B] hover:bg-[#0F5C5B]/20 border border-[#0F5C5B]/20'
                                : 'bg-black/5 text-[#647777] hover:bg-black/10'
                            }`}
                            title="Toggle Component Sub-items"
                          >
                            <Layers className="w-3 h-3 text-[#D9B76C]" />
                            <span>Sub-items {subCount > 0 ? `(${subCount})` : '+ Add'}</span>
                            {isExpanded ? (
                              <ChevronDown className="w-2.5 h-2.5" />
                            ) : (
                              <ChevronRight className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <select
                          value={line.category}
                          onChange={(e) => handleUpdateLine(idx, { category: e.target.value as any })}
                          className="text-xs px-2 py-1 bg-white border border-[#DCE5E3] rounded-lg focus:outline-none"
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
                          value={line.nos}
                          onChange={(e) => handleUpdateLine(idx, { nos: parseInt(e.target.value) || 1 })}
                          className="w-14 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          step="0.001"
                          value={line.grossWT}
                          onChange={(e) => handleUpdateLine(idx, { grossWT: parseFloat(e.target.value) || 0 })}
                          className="w-20 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono font-medium"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.001"
                            value={line.stoneWT === 0 ? '' : line.stoneWT}
                            onChange={(e) => handleUpdateLine(idx, { stoneWT: parseFloat(e.target.value) || 0 })}
                            placeholder="0.000"
                            className="w-16 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono text-[#647777]"
                          />
                          <select
                            value={line.stoneWTUnit || 'g'}
                            onChange={(e) => handleUpdateLine(idx, { stoneWTUnit: e.target.value as 'g' | 'ct' })}
                            className="text-[10px] px-1 py-1 bg-white border border-[#DCE5E3] rounded-lg font-bold text-[#0F5C5B] cursor-pointer"
                            title="Stone Weight Unit: Grams (g) or Carats (ct)"
                          >
                            <option value="g">g</option>
                            <option value="ct">ct</option>
                          </select>
                        </div>
                        {(Number(line.stoneWT) > 0 || (line.stoneWTCarats && line.stoneWTCarats > 0)) && (
                          <div className="text-[9px] text-right font-mono text-[#0F5C5B] font-medium mt-0.5">
                            {line.stoneWTUnit === 'ct'
                              ? `≈ ${((line.stoneWT || 0) * 0.2).toFixed(3)}g`
                              : `≈ ${((line.stoneWT || 0) / 0.2).toFixed(2)}ct`}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-medium text-[#173333]">
                        {line.netWT.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={line.touch}
                          onChange={(e) => handleUpdateLine(idx, { touch: parseFloat(e.target.value) || 0 })}
                          className="w-16 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-[#0F5C5B]">
                        {line.pureWT.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={line.rate}
                          onChange={(e) => handleUpdateLine(idx, { rate: parseFloat(e.target.value) || 0 })}
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
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-sm text-[#0F5C5B]">
                        <SBGCurrency value={line.amount} />
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateLine(idx)}
                            className="p-1 rounded text-[#647777] hover:text-[#0F5C5B] hover:bg-black/5"
                            title="Duplicate line"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(idx)}
                            className="p-1 rounded text-[#B85C5C] hover:bg-[#B85C5C]/10"
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
                              </div>

                              {/* Quick Add Sub-item Buttons */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddSubItem(idx, {
                                      name: 'Rubie',
                                      category: 'PRECIOUS_STONE',
                                      unit: 'ct',
                                      rate: stoneRate,
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
                                      rate: goldRate,
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
                                      rate: diamondRate,
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
                                      rate: mcRate,
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
                                  <Plus className="w-3 h-3" /> Add Component
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
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#DCE5E3] uppercase font-bold text-[9px] tracking-wider">
                                    <tr>
                                      <th className="py-2 px-2 w-8">#</th>
                                      <th className="py-2 px-2 min-w-[130px]">Component Name</th>
                                      <th className="py-2 px-2 min-w-[110px]">Category</th>
                                      <th className="py-2 px-2 text-right w-16">Nos</th>
                                      <th className="py-2 px-2 text-right min-w-[120px]">Weight</th>
                                      <th className="py-2 px-2 text-right w-16">Touch %</th>
                                      <th className="py-2 px-2 text-right w-20 font-bold text-[#0F5C5B]">Pure WT</th>
                                      <th className="py-2 px-2 text-right min-w-[90px]">Rate (₹)</th>
                                      <th className="py-2 px-2 min-w-[70px]">Unit</th>
                                      <th className="py-2 px-2 text-right font-bold text-[#0F5C5B] min-w-[100px]">Amount (₹)</th>
                                      <th className="py-2 px-2 text-center w-10"></th>
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
                                            value={sub.name}
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
                                            value={sub.nos}
                                            onChange={(e) => handleUpdateSubItem(idx, sIdx, { nos: parseInt(e.target.value) || 1 })}
                                            className="w-12 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono"
                                          />
                                        </td>
                                        <td className="py-1.5 px-2 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <input
                                              type="number"
                                              step="0.001"
                                              value={sub.weight === 0 ? '' : sub.weight}
                                              onChange={(e) => handleUpdateSubItem(idx, sIdx, { weight: parseFloat(e.target.value) || 0 })}
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
                                            step="0.01"
                                            value={sub.touch || 0}
                                            onChange={(e) => handleUpdateSubItem(idx, sIdx, { touch: parseFloat(e.target.value) || 0 })}
                                            className="w-14 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono"
                                          />
                                        </td>
                                        <td className="py-1.5 px-2 text-right font-mono font-bold text-[#0F5C5B]">
                                          {(sub.pureWT || 0).toFixed(3)}g
                                        </td>
                                        <td className="py-1.5 px-2 text-right">
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={sub.rate}
                                            onChange={(e) => handleUpdateSubItem(idx, sIdx, { rate: parseFloat(e.target.value) || 0 })}
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
                                        <td className="py-1.5 px-2 text-center">
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
              })}
            </tbody>
          </table>
        </div>
      </SBGCard>

      {/* Pure Weight & Material Breakdown Banner */}
      <div className="glass-panel p-4 bg-white/90 border border-[#DCE5E3] rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#DCE5E3] gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F5C5B]/10 flex items-center justify-center">
              <Scale className="w-4 h-4 text-[#0F5C5B]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B]">
                Total Pure Weight & Material Matrix
              </h4>
              <span className="text-[11px] text-[#647777]">
                Calculated pure fine gold, diamond carats, and gemstone weight breakdown
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#647777] uppercase">Estimate Total Pure WT:</span>
            <span className="font-mono font-black text-base text-[#0F5C5B] px-3 py-1 bg-[#0F5C5B]/10 border border-[#0F5C5B]/20 rounded-lg">
              {calculatedEstimate.totals.totalPureWT.toFixed(3)} g
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Gold Metal Breakdown */}
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-[#8C6A23]">Gold Metal</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">GOLD</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#647777]">Pure Gold WT:</span>
                <span className="font-bold text-[#0F5C5B] text-xs">{(calculatedEstimate.totals.goldPureWT ?? 0).toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#647777]">
                <span>Net Gold WT:</span>
                <span>{(calculatedEstimate.totals.goldNetWT ?? 0).toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#647777]">
                <span>Gross WT:</span>
                <span>{(calculatedEstimate.totals.goldGrossWT ?? 0).toFixed(3)} g</span>
              </div>
            </div>
          </div>

          {/* Diamonds Breakdown */}
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-blue-800 flex items-center gap-1">
                <Gem className="w-3 h-3" /> Diamonds
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">DMD</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#647777]">Total Carats:</span>
                <span className="font-bold text-[#173333] text-xs">{(calculatedEstimate.totals.diamondCarats ?? 0).toFixed(2)} ct</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#647777]">
                <span>Stone WT:</span>
                <span>{(calculatedEstimate.totals.diamondStoneWT ?? 0).toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#647777]">Pure WT:</span>
                <span className={(calculatedEstimate.totals.diamondPureWT ?? 0) > 0 ? "font-bold text-[#0F5C5B]" : "text-[#647777]"}>
                  {(calculatedEstimate.totals.diamondPureWT ?? 0).toFixed(3)} g
                </span>
              </div>
            </div>
          </div>

          {/* Precious Stones / Gemstones Breakdown */}
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gemstones / PS
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">PS</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#647777]">Pure WT:</span>
                <span className="font-bold text-[#0F5C5B] text-xs">{(calculatedEstimate.totals.psPureWT ?? 0).toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#647777]">
                <span>Carats:</span>
                <span className="font-semibold text-[#173333]">{(calculatedEstimate.totals.psCarats ?? 0).toFixed(2)} ct</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#647777]">
                <span>Stone WT:</span>
                <span>{(calculatedEstimate.totals.psStoneWT ?? 0).toFixed(3)} g</span>
              </div>
            </div>
          </div>

          {/* Ledger Posting Weight Summary */}
          <div className="p-3 rounded-xl bg-[#0F5C5B]/5 border border-[#0F5C5B]/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-[#0F5C5B]">Ledger Impact WT</span>
              <span className="text-[10px] font-bold text-[#0F5C5B] bg-[#0F5C5B]/10 px-1.5 py-0.5 rounded">NET PURE</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#647777]">Net Pure Gold:</span>
                <span className="font-black text-[#0F5C5B] text-xs">+{calculatedEstimate.totals.totalPureWT.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#647777]">
                <span>Total Net WT:</span>
                <span className="font-bold text-[#173333]">{calculatedEstimate.totals.totalNetWT.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#647777]">
                <span>Total Gross WT:</span>
                <span>{calculatedEstimate.totals.totalGrossWT.toFixed(3)} g</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Totals & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SBGCard variant="glass" className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#647777]">Gold Metal Value</span>
          <div className="text-lg font-bold text-[#0F5C5B]">
            <SBGCurrency value={calculatedEstimate.totals.goldValue} />
          </div>
          <span className="text-[11px] text-[#0F5C5B] block font-mono font-semibold">
            {(calculatedEstimate.totals.goldPureWT ?? calculatedEstimate.totals.totalPureWT).toFixed(3)}g Pure Gold
          </span>
          <span className="text-[10px] text-[#647777] block font-mono">
            Net: {(calculatedEstimate.totals.goldNetWT ?? calculatedEstimate.totals.totalNetWT).toFixed(3)}g | Gross: {(calculatedEstimate.totals.goldGrossWT ?? calculatedEstimate.totals.totalGrossWT).toFixed(3)}g
          </span>
        </SBGCard>

        <SBGCard variant="glass" className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#647777]">Diamond & Gemstones</span>
          <div className="text-lg font-bold text-[#173333]">
            <SBGCurrency value={calculatedEstimate.totals.diamondValue + calculatedEstimate.totals.psValue} />
          </div>
          <div className="text-[11px] font-mono space-y-0.5">
            <div className="flex justify-between text-[#173333]">
              <span className="text-[#647777]">Dmd:</span>
              <span className="font-semibold">
                {(calculatedEstimate.totals.diamondCarats ?? 0).toFixed(2)} ct
                <span className="text-[#647777] font-normal text-[10px]"> ({(calculatedEstimate.totals.diamondStoneWT ?? 0).toFixed(3)}g)</span>
                {(calculatedEstimate.totals.diamondPureWT ?? 0) > 0 && (
                  <span className="text-[#0F5C5B] font-bold text-[10px]"> • {(calculatedEstimate.totals.diamondPureWT ?? 0).toFixed(3)}g Pure</span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-[#173333]">
              <span className="text-[#647777]">PS:</span>
              <span className="font-semibold">
                {(calculatedEstimate.totals.psCarats ?? 0).toFixed(2)} ct
                <span className="text-[#647777] font-normal text-[10px]"> ({(calculatedEstimate.totals.psStoneWT ?? 0).toFixed(3)}g)</span>
                {(calculatedEstimate.totals.psPureWT ?? 0) > 0 && (
                  <span className="text-[#0F5C5B] font-bold text-[10px]"> • {(calculatedEstimate.totals.psPureWT ?? 0).toFixed(3)}g Pure</span>
                )}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[#647777] block pt-1 border-t border-[#DCE5E3]/60">
            Dmd: ₹{calculatedEstimate.totals.diamondValue.toLocaleString('en-IN')} | PS: ₹{calculatedEstimate.totals.psValue.toLocaleString('en-IN')}
          </span>
        </SBGCard>

        <SBGCard variant="glass" className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#647777]">Making Charges (MC)</span>
          <div className="text-lg font-bold text-[#173333]">
            <SBGCurrency value={calculatedEstimate.totals.mcValue} />
          </div>
          <span className="text-[11px] text-[#647777] block font-mono">
            Craftsmanship on {(calculatedEstimate.totals.goldNetWT && calculatedEstimate.totals.goldNetWT > 0 ? calculatedEstimate.totals.goldNetWT : calculatedEstimate.totals.totalNetWT).toFixed(3)}g Net
          </span>
        </SBGCard>

        <SBGCard variant="gold" className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8C6A23]">Grand Total (incl. GST)</span>
          <div className="text-xl font-black text-[#173333]">
            <SBGCurrency value={calculatedEstimate.totals.grandTotal} />
          </div>
          <span className="text-[11px] text-[#8C6A23] block font-mono font-bold">
            Total Pure WT: {calculatedEstimate.totals.totalPureWT.toFixed(3)}g
          </span>
          <span className="text-[10px] text-[#8C6A23]/80 block">
            Taxable: ₹{calculatedEstimate.totals.taxableValue.toLocaleString('en-IN')} + GST {calculatedEstimate.totals.gstRate}%
          </span>
        </SBGCard>
      </div>

      {/* Balance Reconciliation Comparison Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
          <Scale className="w-4 h-4" /> Customer Ledger Balance Adjustment & Impact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Account Position */}
          <div className="glass-panel p-5 space-y-3 border-l-4 border-l-[#0F5C5B]">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> Customer Account Position: {selectedCustomer?.name || 'Customer'}
              </span>
              <SBGBadge variant={transactionType === 'PURCHASE' ? 'teal' : 'gold'}>
                {transactionType === 'PURCHASE' ? 'Purchase (Receipt −)' : 'Sale (Issue +)'}
              </SBGBadge>
            </div>

            {(() => {
              const isPurchase = transactionType === 'PURCHASE';
              const isFix = settlementMode === 'FIX' || settlementMode === 'CASH_ONLY';
              const settledGold = calculatedEstimate.totals.settledGoldWT ?? (isFix ? 0 : (calculatedEstimate.totals.goldPureWT ?? calculatedEstimate.totals.totalPureWT));
              const settledCash = calculatedEstimate.totals.settledCashAmount ?? (isFix ? calculatedEstimate.totals.grandTotal : (calculatedEstimate.totals.remainingCashValue ?? calculatedEstimate.totals.grandTotal));

              const displayDeltaPureWT = isPurchase ? -settledGold : settledGold;
              const displayDeltaAmount = isPurchase ? -settledCash : settledCash;

              const currentWT = selectedCustomer?.currentWT || 0;
              const currentMC = selectedCustomer?.currentMC || 0;

              const newBalWT = Number((currentWT + displayDeltaPureWT).toFixed(3));
              const newBalMC = Number((currentMC + displayDeltaAmount).toFixed(2));

              return (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#647777] block text-[10px] uppercase font-bold">1. Previous Gold Balance</span>
                    <span className="font-mono font-bold">{currentWT.toFixed(3)} g</span>
                  </div>
                  <div>
                    <span className="text-[#647777] block text-[10px] uppercase font-bold">1. Previous Cash Balance</span>
                    <SBGCurrency value={currentMC} />
                  </div>

                  <div className="pt-2 border-t border-[#DCE5E3]">
                    <span className={`block text-[10px] uppercase font-bold ${isPurchase ? 'text-amber-700' : 'text-[#0F5C5B]'}`}>
                      2. ({isPurchase ? '−' : '+'}) {isPurchase ? 'Purchase Settled Gold' : 'Sale Settled Gold'}
                    </span>
                    <span className={`font-mono font-bold text-sm ${isPurchase ? 'text-amber-800' : 'text-[#0F5C5B]'}`}>
                      {displayDeltaPureWT >= 0 ? '+' : '−'} {Math.abs(displayDeltaPureWT).toFixed(3)} g
                    </span>
                    <span className="text-[10px] text-[#647777] block font-mono">
                      (Adjusts Customer Gold Balance)
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#DCE5E3]">
                    <span className={`block text-[10px] uppercase font-bold ${isPurchase ? 'text-amber-700' : 'text-[#0F5C5B]'}`}>
                      2. ({isPurchase ? '−' : '+'}) {isPurchase ? 'Purchase Settled Cash' : 'Sale Settled Cash'}
                    </span>
                    <span className={`font-mono font-bold text-sm ${isPurchase ? 'text-amber-800' : 'text-[#0F5C5B]'}`}>
                      {displayDeltaAmount >= 0 ? '+' : '−'} <SBGCurrency value={Math.abs(displayDeltaAmount)} />
                    </span>
                    <span className="text-[10px] text-[#647777] block font-mono">
                      (Adjusts Customer Cash Balance)
                    </span>
                  </div>

                  <div className="pt-2 border-t-2 border-[#0F5C5B] col-span-2 grid grid-cols-2 gap-4 bg-[#0F5C5B]/5 p-2 rounded-xl">
                    <div>
                      <span className="text-[#0F5C5B] block text-[10px] uppercase font-bold">3. (=) New Pure Gold Balance</span>
                      <span className="font-mono font-black text-sm text-[#0F5C5B]">
                        {newBalWT.toFixed(3)} g
                      </span>
                    </div>
                    <div>
                      <span className="text-[#0F5C5B] block text-[10px] uppercase font-bold">3. (=) New Cash Balance</span>
                      <SBGCurrency
                        value={newBalMC}
                        className="text-sm font-black text-[#0F5C5B]"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Ledger Posting Info */}
          <div className="glass-panel p-5 space-y-3 border-l-4 border-l-[#D9B76C] flex flex-col justify-between">
            {(() => {
              const isPurchase = transactionType === 'PURCHASE';
              const isFix = settlementMode === 'FIX' || settlementMode === 'CASH_ONLY';
              const settledGold = calculatedEstimate.totals.settledGoldWT ?? (isFix ? 0 : (calculatedEstimate.totals.goldPureWT ?? calculatedEstimate.totals.totalPureWT));
              const settledCash = calculatedEstimate.totals.settledCashAmount ?? (isFix ? calculatedEstimate.totals.grandTotal : (calculatedEstimate.totals.remainingCashValue ?? calculatedEstimate.totals.grandTotal));

              const displayDeltaPureWT = isPurchase ? -settledGold : settledGold;
              const displayDeltaAmount = isPurchase ? -settledCash : settledCash;

              const modeLabel = isFix
                ? 'FIX (100% Cash)'
                : unfixPreset === 'B2B_WITHOUT_MC'
                ? 'UNFIX: B2B - Without MC'
                : unfixPreset === 'B2B_WITH_MC'
                ? 'UNFIX: B2B - With MC'
                : unfixPreset === 'ALL_IN_GOLD'
                ? 'UNFIX: All in Gold (100%)'
                : 'UNFIX: Custom & Split Gold';

              return (
                <div>
                  <div className="flex items-center justify-between border-b border-black/5 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A23] flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5" /> Ledger Posting Action
                    </span>
                    <SBGBadge variant="gold">{modeLabel}</SBGBadge>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-[#526B6A]">
                    <p>
                      Clicking <strong>"Save & Confirm to Ledger"</strong> will automatically create a verified{' '}
                      <strong>{isPurchase ? 'PURCHASE / RECEIPT' : 'SALE / ISSUE'}</strong> transaction in{' '}
                      {selectedCustomer?.name || 'Customer'}'s ledger and update their live running balances immediately.
                    </p>
                    <div className="p-3 bg-white/80 rounded-xl border border-[#DCE5E3] space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#647777]">Transaction Type:</span>
                        <span className={`font-bold ${isPurchase ? 'text-amber-800' : 'text-[#173333]'}`}>
                          {isPurchase ? 'RECEIPT / PURCHASE (Negative Adjustment)' : 'ISSUE / SALE (Positive Adjustment)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#647777]">Reference:</span>
                        <span className="font-bold text-[#0F5C5B]">{estimateNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#647777]">Pure Gold Balance Delta:</span>
                        <span className={`font-bold ${isPurchase ? 'text-amber-800' : 'text-[#0F5C5B]'}`}>
                          {displayDeltaPureWT >= 0 ? '+' : '−'}{Math.abs(displayDeltaPureWT).toFixed(3)} g
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#647777]">Cash Balance Delta:</span>
                        <span className={`font-bold ${isPurchase ? 'text-amber-800' : 'text-[#0F5C5B]'}`}>
                          {displayDeltaAmount >= 0 ? '+' : '−'}₹{Math.abs(displayDeltaAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 border-t border-[#DCE5E3]">
              <span className="text-[11px] text-[#647777] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B57]" /> All formulas and GST calculations synchronized with live rates.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
