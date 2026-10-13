import React, { useState, useMemo } from 'react';
import { useSBG } from '../store/sbgStore';
import { calculateEstimateSheet } from '../core/calculations/estimateEngine';
import { roundWeight, roundCurrency, formatDateDDMMYYYY } from '../core/calculations/mathUtils';
import {
  SBGCard,
  SBGButton,
  SBGBadge,
  SBGCurrency,
  SBGWeight,
  SBGModal,
  SBGInput,
} from '../components/ui';
import {
  FileSpreadsheet,
  ArrowLeft,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Building,
  User,
  Edit3,
  Scale,
  Wallet,
  ExternalLink,
  RotateCcw,
  Check,
  Gem,
  Sparkles,
  Trash2,
  CornerDownRight,
  Layers,
  Coins,
  Wrench,
  Calculator,
  BookOpen,
  ChevronDown,
  Pencil,
} from 'lucide-react';
import { UnfixPresetType, UnfixComponentSettlement } from '../core/calculations/types';
import { ActiveTab } from '../components/layout/AppShell';

interface EstimateDetailsViewProps {
  estimateId: string;
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const EstimateDetailsView: React.FC<EstimateDetailsViewProps> = ({
  estimateId,
  onNavigate,
}) => {
  const { estimates, customers, transactions, confirmEstimate, unconfirmEstimate, updateEstimate, deleteEstimate } = useSBG();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  const rawEstimate = estimates.find((e) => e.id === estimateId) || estimates[0];
  const customer = customers.find((c) => c.id === rawEstimate?.customerId);

  // Settlement configuration local state
  const [unfixPreset, setUnfixPreset] = useState<UnfixPresetType>(
    rawEstimate?.unfixPreset || 'B2B_WITHOUT_MC'
  );
  const [unfixGoldRate, setUnfixGoldRate] = useState<number>(
    rawEstimate?.unfixGoldRate || 0
  );
  const [settlementMode, setSettlementMode] = useState<'FIX' | 'UNFIX'>(
    rawEstimate?.settlementMode === 'FIX' ? 'FIX' : 'UNFIX'
  );
  const [customSettlement, setCustomSettlement] = useState<UnfixComponentSettlement>(
    rawEstimate?.unfixComponentSettlement || {
      goldMetalMode: 'GOLD',
      goldGSTMode: 'GOLD',
      mcMode: 'CASH',
      stonesMode: 'CASH',
      expensesMode: 'CASH',
      otherGstMode: 'CASH',
      goldPaidInMetalGrams: 0,
      goldPaidInCashAmount: 0,
    }
  );
  const [showExpensesSection, setShowExpensesSection] = useState(false);
  const [huidCharges, setHuidCharges] = useState<number>(rawEstimate?.additionalExpenses?.huidCharges || 0);
  const [courierCharges, setCourierCharges] = useState<number>(rawEstimate?.additionalExpenses?.courierCharges || 0);
  const [otherCharges, setOtherCharges] = useState<number>(rawEstimate?.additionalExpenses?.otherCharges || 0);
  const [otherChargesRemarks, setOtherChargesRemarks] = useState<string>(rawEstimate?.additionalExpenses?.otherChargesRemarks || '');

  // Dynamically recalculate sheet so category breakdowns & deltas are always live and accurate
  const estimate = useMemo(() => {
    if (!rawEstimate) return rawEstimate;
    return calculateEstimateSheet(
      {
        ...rawEstimate,
        transactionType: rawEstimate.transactionType || (rawEstimate.direction === 'ISSUE' ? 'SALE' : 'PURCHASE'),
        direction: rawEstimate.direction || (rawEstimate.transactionType === 'SALE' ? 'ISSUE' : 'RECEIPT'),
        settlementMode: settlementMode,
        unfixPreset: unfixPreset,
        unfixGoldRate: unfixGoldRate,
        unfixComponentSettlement: customSettlement,
        additionalExpenses: {
          huidCharges,
          courierCharges,
          otherCharges,
          otherChargesRemarks,
        },
      },
      rawEstimate.totals?.gstRate ?? 3.0
    );
  }, [rawEstimate, settlementMode, unfixPreset, unfixGoldRate, customSettlement, huidCharges, courierCharges, otherCharges, otherChargesRemarks]);

  if (!estimate || !rawEstimate) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[#647777]">Estimate cost sheet not found.</p>
        <SBGButton variant="outline" className="mt-4" onClick={() => onNavigate('estimates')}>
          Return to Estimates
        </SBGButton>
      </div>
    );
  }

  // Linked transaction in customer ledger if confirmed
  const linkedTx = transactions.find(
    (t) => t.estimateId === estimate.id || (t.erpRef && t.erpRef === estimate.estimateNo)
  );

  // Settlement handlers
  const handlePresetChange = async (newPreset: string) => {
    const newSettlementMode: 'FIX' | 'UNFIX' = newPreset === 'FIX' ? 'FIX' : 'UNFIX';
    const newUnfixPreset: UnfixPresetType = newPreset as UnfixPresetType;
    let newCustom: UnfixComponentSettlement = { ...customSettlement };

    if (newPreset === 'FIX') {
      newCustom = {
        goldMetalMode: 'CASH',
        goldGSTMode: 'CASH',
        mcMode: 'CASH',
        stonesMode: 'CASH',
        expensesMode: 'CASH',
        otherGstMode: 'CASH',
        goldPaidInMetalGrams: 0,
        goldPaidInCashAmount: 0,
      };
    } else if (newPreset === 'B2B_WITHOUT_MC') {
      newCustom = {
        goldMetalMode: 'GOLD',
        goldGSTMode: 'GOLD',
        mcMode: 'CASH',
        stonesMode: 'CASH',
        expensesMode: 'CASH',
        otherGstMode: 'CASH',
        goldPaidInMetalGrams: 0,
        goldPaidInCashAmount: 0,
      };
    } else if (newPreset === 'B2B_WITH_MC') {
      newCustom = {
        goldMetalMode: 'GOLD',
        goldGSTMode: 'GOLD',
        mcMode: 'GOLD',
        stonesMode: 'CASH',
        expensesMode: 'CASH',
        otherGstMode: 'CASH',
        goldPaidInMetalGrams: 0,
        goldPaidInCashAmount: 0,
      };
    } else if (newPreset === 'ALL_IN_GOLD') {
      newCustom = {
        goldMetalMode: 'GOLD',
        goldGSTMode: 'GOLD',
        mcMode: 'GOLD',
        stonesMode: 'GOLD',
        expensesMode: 'GOLD',
        otherGstMode: 'GOLD',
        goldPaidInMetalGrams: 0,
        goldPaidInCashAmount: 0,
      };
    }

    setSettlementMode(newSettlementMode);
    setUnfixPreset(newUnfixPreset);
    setCustomSettlement(newCustom);

    if (rawEstimate) {
      await updateEstimate(rawEstimate.id, {
        ...rawEstimate,
        settlementMode: newSettlementMode,
        unfixPreset: newUnfixPreset,
        unfixComponentSettlement: newCustom,
      });
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

  const updateCustomRow = async (key: keyof UnfixComponentSettlement, value: any) => {
    setSettlementMode('UNFIX');
    setUnfixPreset('CUSTOM');
    const base = unfixPreset !== 'CUSTOM' ? getBaselineForPreset(unfixPreset) : customSettlement;
    const updated = { ...base, [key]: value };
    setCustomSettlement(updated);
    if (rawEstimate) {
      await updateEstimate(rawEstimate.id, {
        ...rawEstimate,
        settlementMode: 'UNFIX',
        unfixPreset: 'CUSTOM',
        unfixComponentSettlement: updated,
      });
    }
  };

  const handleGoldRateChange = async (val: number) => {
    setUnfixGoldRate(val);
    if (rawEstimate) {
      await updateEstimate(rawEstimate.id, {
        ...rawEstimate,
        unfixGoldRate: val,
      });
    }
  };

  // Determine transaction nature & components
  const isPurchase = estimate.transactionType === 'PURCHASE' || estimate.direction === 'RECEIPT';
  const isFix = settlementMode === 'FIX';
  const activePresetValue = isFix ? 'FIX' : (unfixPreset || 'B2B_WITHOUT_MC');

  const currentMetalMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? customSettlement.goldMetalMode : 'GOLD');
  const currentGoldGstMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? customSettlement.goldGSTMode : 'GOLD');
  const currentMcMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? customSettlement.mcMode : (unfixPreset === 'B2B_WITH_MC' || unfixPreset === 'ALL_IN_GOLD' ? 'GOLD' : 'CASH'));
  const currentStonesMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? customSettlement.stonesMode : (unfixPreset === 'ALL_IN_GOLD' ? 'GOLD' : 'CASH'));
  const currentExpensesMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? customSettlement.expensesMode : (unfixPreset === 'ALL_IN_GOLD' ? 'GOLD' : 'CASH'));
  const currentOtherGstMode = isFix ? 'CASH' : (unfixPreset === 'CUSTOM' ? (customSettlement.otherGstMode || 'CASH') : (unfixPreset === 'ALL_IN_GOLD' ? 'GOLD' : 'CASH'));

  const activePresetLabel = useMemo(() => {
    switch (activePresetValue) {
      case 'B2B_WITHOUT_MC': return 'B2B - Without MC';
      case 'B2B_WITH_MC': return 'B2B - With MC';
      case 'ALL_IN_GOLD': return 'All in Gold (100%)';
      case 'FIX': return 'FIX (100% Cash)';
      case 'CUSTOM': return 'Custom / Flexible';
      default: return activePresetValue;
    }
  }, [activePresetValue]);

  const itemTableTotals = useMemo(() => {
    return estimate.items.reduce(
      (acc, item) => ({
        nos: acc.nos + (item.nos || 1),
        grossWT: acc.grossWT + (item.grossWT || 0),
        stoneWT: acc.stoneWT + (item.stoneWT || 0),
        netWT: acc.netWT + (item.netWT || 0),
        pureWT: acc.pureWT + (item.pureWT || 0),
        amount: acc.amount + (item.amount || 0),
      }),
      { nos: 0, grossWT: 0, stoneWT: 0, netWT: 0, pureWT: 0, amount: 0 }
    );
  }, [estimate.items]);

  const effectiveGoldRate = (unfixGoldRate && unfixGoldRate > 0) ? Number(unfixGoldRate) : (Number(estimate.goldRate) > 0 ? Number(estimate.goldRate) : 1);
  const goldPureToAdjust = estimate.totals.goldPureWT ?? estimate.totals.totalPureWT;
  const goldMetalValue = estimate.totals.goldValue;

  const goldGstAmount = estimate.totals.goldGstAmount ?? Number((goldMetalValue * ((estimate.totals.gstRate || 3) / 100)).toFixed(2));
  const goldGstGrams = Number((goldGstAmount / effectiveGoldRate).toFixed(3));

  const mcValue = estimate.totals.mcValue;
  const mcGrams = Number((mcValue / effectiveGoldRate).toFixed(3));

  const stonesTotal = estimate.totals.diamondValue + estimate.totals.psValue;
  const stonesGrams = Number((stonesTotal / effectiveGoldRate).toFixed(3));

  const expensesTotal = estimate.totals.totalExpenses ?? (huidCharges + courierCharges + otherCharges);
  const expensesGrams = Number((expensesTotal / effectiveGoldRate).toFixed(3));

  const otherGstAmount = estimate.totals.nonGoldGstAmount ?? Math.max(0, Number((estimate.totals.gstAmount - goldGstAmount).toFixed(2)));
  const otherGstGrams = Number((otherGstAmount / effectiveGoldRate).toFixed(3));

  const settledGoldWT = estimate.totals.settledGoldWT ?? (isFix ? 0 : goldPureToAdjust);
  const settledCashAmount = estimate.totals.settledCashAmount ?? (isFix ? estimate.totals.grandTotal : (estimate.totals.remainingCashValue ?? estimate.totals.grandTotal));

  const displayDeltaPureWT = isPurchase ? -settledGoldWT : settledGoldWT;
  const displayDeltaAmount = isPurchase ? -settledCashAmount : settledCashAmount;

  const handleDeleteEstimate = async () => {
    if (!rawEstimate) return;
    await deleteEstimate(rawEstimate.id);
    setIsDeleteModalOpen(false);
    onNavigate('estimates');
  };

  // Accurate balance determination
  let prevWT: number;
  let prevMC: number;
  let newBalWT: number;
  let newBalMC: number;

  if (estimate.status === 'CONFIRMED' && linkedTx) {
    const endWT = linkedTx.balanceWT;
    const endMC = linkedTx.balanceMC;
    prevWT = estimate.previousBalanceWT !== undefined
      ? estimate.previousBalanceWT
      : Number((endWT - linkedTx.pureWT).toFixed(3));
    prevMC = estimate.previousBalanceMC !== undefined
      ? estimate.previousBalanceMC
      : Number((endMC - linkedTx.totalAmount).toFixed(2));
    newBalWT = Number((prevWT + displayDeltaPureWT).toFixed(3));
    newBalMC = Number((prevMC + displayDeltaAmount).toFixed(2));
  } else if (estimate.previousBalanceWT !== undefined && estimate.previousBalanceMC !== undefined) {
    prevWT = estimate.previousBalanceWT;
    prevMC = estimate.previousBalanceMC;
    newBalWT = Number((prevWT + displayDeltaPureWT).toFixed(3));
    newBalMC = Number((prevMC + displayDeltaAmount).toFixed(2));
  } else if (estimate.balanceComparison?.ledgerOldPureWT !== undefined) {
    prevWT = estimate.balanceComparison.ledgerOldPureWT;
    prevMC = estimate.balanceComparison.ledgerOldAmount;
    newBalWT = Number((prevWT + displayDeltaPureWT).toFixed(3));
    newBalMC = Number((prevMC + displayDeltaAmount).toFixed(2));
  } else {
    prevWT = customer?.currentWT ?? 0;
    prevMC = customer?.currentMC ?? 0;
    newBalWT = Number((prevWT + displayDeltaPureWT).toFixed(3));
    newBalMC = Number((prevMC + displayDeltaAmount).toFixed(2));
  }

  const deltaPureWT = displayDeltaPureWT;
  const deltaMC = displayDeltaAmount;
  const newWT = newBalWT;
  const newMC = newBalMC;

  const handleToggleTransactionType = async (newType: 'PURCHASE' | 'SALE') => {
    if (!rawEstimate) return;
    const isNowPurchase = newType === 'PURCHASE';
    const newDirection = isNowPurchase ? 'RECEIPT' : 'ISSUE';

    await updateEstimate(rawEstimate.id, {
      ...rawEstimate,
      transactionType: newType,
      direction: newDirection,
    });

    setShowToast(`Estimate ${rawEstimate.estimateNo} switched to ${newType}! ${isNowPurchase ? 'Balances adjusted in Negative (−).' : 'Balances adjusted in Positive (+).'}`);
    setTimeout(() => setShowToast(null), 5000);
  };

  const currentPureWT = estimate.totals.totalPureWT;
  const currentGrandTotal = estimate.totals.grandTotal;

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${estimate.estimateNo} - ${customer?.name || estimate.customerName} - SBG Cost Sheet`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleConfirmAndPost = async () => {
    await confirmEstimate(estimate.id);
    setIsConfirmModalOpen(false);
    const wtSignStr = deltaPureWT >= 0 ? `+${deltaPureWT.toFixed(3)}g` : `${deltaPureWT.toFixed(3)}g`;
    const mcSignStr = deltaMC >= 0 ? `+₹${deltaMC.toLocaleString('en-IN')}` : `-₹${Math.abs(deltaMC).toLocaleString('en-IN')}`;
    setShowToast(`Estimate ${estimate.estimateNo} confirmed! Customer ledger updated with ${wtSignStr} Gold and ${mcSignStr} Cash.`);
    setTimeout(() => setShowToast(null), 5000);
  };

  const handleReopenToDraft = async () => {
    await unconfirmEstimate(estimate.id);
    setIsReopenModalOpen(false);
    setShowToast(`Estimate ${estimate.estimateNo} reopened to Draft. Transaction removed from Customer Ledger.`);
    setTimeout(() => setShowToast(null), 5000);
  };

  const isReconciled = estimate.balanceComparison?.isReconciled ?? true;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F5C5B] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 animate-fade-in no-print">
          <CheckCircle2 className="w-5 h-5 text-[#E5C378] shrink-0" />
          <span className="text-xs font-semibold">{showToast}</span>
          <button onClick={() => setShowToast(null)} className="ml-2 text-white/70 hover:text-white font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <button
          onClick={() => onNavigate('estimates')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0F5C5B] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Estimates
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Toggle Purchase / Sales */}
          <div className="flex items-center rounded-xl bg-white border border-[#DCE5E3] p-1 shadow-2xs">
            <button
              onClick={() => handleToggleTransactionType('PURCHASE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isPurchase
                  ? 'bg-[#0F5C5B] text-white shadow-xs'
                  : 'text-[#647777] hover:text-[#0F5C5B]'
              }`}
              title="Set as Purchase (Receipt - Adjust in Negative)"
            >
              <span>PURCHASE (Receipt −)</span>
              <span className={`text-[10px] px-1 py-0.2 rounded ${isPurchase ? 'bg-white/20 text-white' : 'bg-black/5 text-[#647777]'}`}>
                − Adjust
              </span>
            </button>
            <button
              onClick={() => handleToggleTransactionType('SALE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                !isPurchase
                  ? 'bg-[#D9B76C] text-[#173333] shadow-xs'
                  : 'text-[#647777] hover:text-[#0F5C5B]'
              }`}
              title="Set as Sale (Issue - Adjust in Positive)"
            >
              <span>SALE (Issue +)</span>
              <span className={`text-[10px] px-1 py-0.2 rounded ${!isPurchase ? 'bg-black/15 text-[#173333]' : 'bg-black/5 text-[#647777]'}`}>
                + Adjust
              </span>
            </button>
          </div>

          {estimate.status === 'CONFIRMED' ? (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#E6F8F2] text-[#1A825B] border border-[#1A825B]/20">
                <CheckCircle2 className="w-4 h-4" /> Confirmed & Posted
              </span>

              {customer && (
                <SBGButton
                  variant="outline"
                  size="sm"
                  icon={<ExternalLink className="w-4 h-4" />}
                  onClick={() => onNavigate('customer-profile', customer.id)}
                >
                  View Ledger
                </SBGButton>
              )}

              <SBGButton
                variant="secondary"
                size="sm"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => setIsReopenModalOpen(true)}
              >
                Reopen Draft
              </SBGButton>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FEF5E6] text-[#B87B1D] border border-[#B87B1D]/20">
              <AlertTriangle className="w-4 h-4" /> Draft
            </span>
          )}

          <SBGButton
            variant="gold"
            size="sm"
            icon={<Edit3 className="w-4 h-4" />}
            onClick={() => onNavigate('edit-estimate', estimate.id)}
          >
            Edit
          </SBGButton>

          <SBGButton
            variant="glass"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Print
          </SBGButton>

          {estimate.status === 'DRAFT' && (
            <SBGButton
              variant="primary"
              size="sm"
              icon={<FileCheck className="w-4 h-4" />}
              onClick={() => setIsConfirmModalOpen(true)}
            >
              Confirm & Post to Ledger
            </SBGButton>
          )}

          <SBGButton
            variant="outline"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-rose-600" />}
            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
            onClick={() => setIsDeleteModalOpen(true)}
            title="Delete this estimate"
          >
            Delete
          </SBGButton>
        </div>
      </div>

      {/* Main Printable Estimate Cost Sheet */}
      <div className="glass-panel p-6 sm:p-10 print:p-0 space-y-6 print:space-y-3 bg-white/90 print:bg-white shadow-lg print:shadow-none print:border-none">
        {/* Top Invoice Header */}
        <div className="flex flex-col md:flex-row print:flex-row justify-between items-start border-b-2 border-[#0F5C5B]/40 pb-4 print:pb-3 gap-4 print:gap-3">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 print:w-12 print:h-12 flex items-center justify-center shrink-0 mt-0.5 bg-white p-1 rounded-xl border border-[#DCE5E3]">
              <img src="/sbg-logo.png" alt="Sree Balaji Gold" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-2xl print:text-xl font-black tracking-wider text-[#0F5C5B]">
                  SREE BALAJI GOLD
                </span>
                <span className="text-[10px] print:text-[8.5px] font-bold px-2 py-0.5 rounded bg-[#0F5C5B]/10 text-[#0F5C5B] border border-[#0F5C5B]/20 uppercase">
                  {isPurchase ? 'PURCHASE / RECEIPT' : 'SALE / ISSUE'}
                </span>
                <span className="text-[10px] print:text-[8.5px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                  COST SHEET
                </span>
              </div>
              <div className="text-[11px] print:text-[9px] text-[#647777] font-medium tracking-wide">
                WHOLESALE BULLION & FINE ORNAMENTS • ZAVERI BAZAAR, MUMBAI
              </div>

              {/* Customer Info (Integrated inline to save vertical space) */}
              <div className="flex items-center gap-2 text-xs print:text-[10px] text-[#647777] flex-wrap pt-0.5">
                <span className="font-semibold text-[#173333]">Customer:</span>
                <span className="font-black text-[#0F5C5B] text-sm print:text-xs">
                  {customer?.name || estimate.customerName}
                </span>
                {customer?.code && (
                  <span className="font-mono text-[10px] print:text-[8.5px] font-semibold text-[#647777] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                    {customer.code}
                  </span>
                )}
                {(customer?.city || customer?.phone) && (
                  <span className="text-[#647777]">
                    • {[customer?.city || 'Mumbai, Maharashtra', customer?.phone].filter(Boolean).join(' • ')}
                  </span>
                )}
                {customer?.gstin && (
                  <span className="font-mono text-[10.5px] print:text-[9px] text-[#647777] bg-gray-50 border border-[#DCE5E3] px-1.5 py-0.5 rounded">
                    GSTIN: {customer.gstin}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-left md:text-right print:text-right space-y-1 text-xs print:text-[9.5px] shrink-0 bg-[#FAF9F5] print:bg-[#FAF9F5] p-2.5 rounded-lg border border-[#ECD9A5]/60">
            <div className="text-base print:text-sm font-mono font-black text-[#0F5C5B] leading-tight">
              {estimate.estimateNo}
            </div>
            <div className="text-[#647777]">
              Date: <strong className="text-[#173333] font-bold">{formatDateDDMMYYYY(estimate.estimateDate)}</strong>
            </div>
            {estimate.customerRef && (
              <div className="text-[#647777]">
                Ref: <strong className="text-[#173333] font-semibold">{estimate.customerRef}</strong>
              </div>
            )}
            {estimate.orderRef && (
              <div className="text-[#647777]">
                Order: <strong className="text-[#0F5C5B] font-semibold">{estimate.orderRef}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto touch-scroll print:overflow-visible rounded-xl border border-[#DCE5E3]">
          <table className="w-full min-w-[780px] print:min-w-0 text-left text-xs print:text-[10px]">
            <thead className="bg-[#0F5C5B] text-white print:bg-[#0F5C5B] print:text-white uppercase font-bold text-[10px] print:text-[8.5px] tracking-wider">
              <tr>
                <th className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-center w-8">#</th>
                <th className="py-2.5 px-3 print:py-1.5 print:px-2">Item Description</th>
                <th className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-center">Category</th>
                <th className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right">Nos</th>
                <th className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right">Gross WT</th>
                <th className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right">Stone WT</th>
                <th className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right">Net WT</th>
                <th className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right">Touch</th>
                <th className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right">Pure WT</th>
                <th className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right">Rate</th>
                <th className="py-2.5 px-3 print:py-1.5 print:px-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5E3]/60 bg-white">
              {estimate.items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <tr className="break-inside-avoid hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 font-mono text-[#647777] text-center">{idx + 1}</td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 font-semibold text-[#173333]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.item}</span>
                        {item.subItems && item.subItems.length > 0 && (
                          <span className="text-[9px] print:text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#0F5C5B]/10 text-[#0F5C5B]">
                            {item.subItems.length} Sub-items
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-center">
                      <span className={`text-[9.5px] print:text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                        item.category === 'GOLD'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : item.category === 'DIAMOND'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : item.category === 'PRECIOUS_STONE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}>
                        {item.category === 'PRECIOUS_STONE' ? 'PRECIOUS STONE' : item.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right font-mono font-medium">{item.nos}</td>
                    <td className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right font-mono whitespace-nowrap">{item.grossWT.toFixed(3)}g</td>
                    <td className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right font-mono text-[#647777] whitespace-nowrap">
                      <div>{item.stoneWT.toFixed(3)}g</div>
                      {(item.stoneWTCarats || item.stoneWT > 0) ? (
                        <div className="text-[10px] print:text-[8.5px] text-blue-700 font-semibold">
                          {(item.stoneWTCarats || (item.stoneWT / 0.2)).toFixed(2)}ct
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right font-mono whitespace-nowrap">{item.netWT.toFixed(3)}g</td>
                    <td className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right font-mono whitespace-nowrap">{item.touch > 0 ? `${item.touch.toFixed(2)}%` : '—'}</td>
                    <td className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right font-mono whitespace-nowrap">
                      {item.pureWT.toFixed(3)}g
                    </td>
                    <td className="py-2.5 px-2.5 print:py-1.5 print:px-1.5 text-right font-mono text-[#647777] whitespace-nowrap">
                      ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      <span className="text-[10px] print:text-[8px] font-semibold text-[#0F5C5B] ml-0.5">
                        {item.rateUnit === 'PER_CT' ? '/ct' : item.rateUnit === 'PER_G' ? '/g' : item.rateUnit === 'PER_PIECE' ? '/pc' : ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-right font-mono font-bold text-sm print:text-xs text-[#0F5C5B] whitespace-nowrap">
                      <SBGCurrency value={item.amount} />
                    </td>
                  </tr>

                  {/* Sub-items Nested Row */}
                  {item.subItems && item.subItems.length > 0 && (
                    <tr key={`${item.id}-subs`} className="bg-[#FAF9F6]/80 border-b border-[#DCE5E3] break-inside-avoid">
                      <td colSpan={11} className="py-2.5 px-4 pl-10 print:py-1.5 print:px-2 print:pl-4">
                        <div className="bg-white/95 rounded-xl border border-[#DCE5E3] p-2.5 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#EFECE6]">
                            <div className="flex items-center gap-1.5 font-bold text-[#0F5C5B]">
                              <CornerDownRight className="w-3.5 h-3.5 text-[#D9B76C]" />
                              <span>Sub-items Breakdown for: <span className="text-[#173333]">{item.item}</span></span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0F5C5B]/10 text-[#0F5C5B] font-bold">
                              {item.subItems.length} Component{item.subItems.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="overflow-x-auto touch-scroll print:overflow-visible">
                            <table className="w-full min-w-[650px] print:min-w-0 text-left text-[11px]">
                              <thead className="text-[#647777] border-b border-[#EFECE6] uppercase font-bold text-[9px] tracking-wider">
                                <tr>
                                  <th className="py-1 px-2">#</th>
                                  <th className="py-1 px-2">Component</th>
                                  <th className="py-1 px-2">Category</th>
                                  <th className="py-1 px-2 text-right">Nos</th>
                                  <th className="py-1 px-2 text-right">Weight</th>
                                  <th className="py-1 px-2 text-right">Touch</th>
                                  <th className="py-1 px-2 text-right">Pure WT</th>
                                  <th className="py-1 px-2 text-right">Rate</th>
                                  <th className="py-1 px-2 text-right font-bold text-[#0F5C5B]">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#F6F4EE]">
                                {item.subItems.map((sub, sIdx) => (
                                  <tr key={sub.id || sIdx} className="hover:bg-[#FAF9F6]">
                                    <td className="py-1 px-2 font-mono text-[#647777]">{idx + 1}.{sIdx + 1}</td>
                                    <td className="py-1 px-2 font-semibold text-[#173333]">{sub.name}</td>
                                    <td className="py-1 px-2">
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/5 font-medium">
                                        {sub.category}
                                      </span>
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono">{sub.nos || 1}</td>
                                    <td className="py-1 px-2 text-right font-mono">
                                      {sub.weight} {sub.unit}
                                      {sub.unit === 'ct' && sub.weightInGrams ? (
                                        <span className="text-[9px] text-[#647777] block font-sans">
                                          ({sub.weightInGrams.toFixed(3)}g)
                                        </span>
                                      ) : sub.unit === 'g' && sub.weightInCarats ? (
                                        <span className="text-[9px] text-[#647777] block font-sans">
                                          ({sub.weightInCarats.toFixed(2)}ct)
                                        </span>
                                      ) : null}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono">
                                      {sub.touch && sub.touch > 0 ? `${sub.touch}%` : '-'}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono">
                                      {sub.pureWT ? `${sub.pureWT.toFixed(3)}g` : '-'}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono text-[#647777]">
                                      ₹{sub.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      <span className="text-[9px] text-[#0F5C5B] ml-0.5">
                                        {sub.rateUnit === 'PER_CT' ? '/ct' : sub.rateUnit === 'PER_G' ? '/g' : sub.rateUnit === 'PER_PIECE' ? '/pc' : ''}
                                      </span>
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono font-bold text-[#0F5C5B]">
                                      <SBGCurrency value={sub.amount} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-[#FAF9F5] print:bg-[#FAF9F5] border-t-2 border-b-2 border-[#0F5C5B] font-bold text-xs print:text-[9.5px]">
              <tr className="text-[#173333]">
                <td colSpan={3} className="py-2.5 px-3 print:py-2 print:px-2 font-black uppercase tracking-wider text-[#0F5C5B]">
                  Total ({estimate.items.length} Items)
                </td>
                <td className="py-2.5 px-2.5 print:py-2 print:px-1.5 text-right font-mono font-black">
                  {itemTableTotals.nos}
                </td>
                <td className="py-2.5 px-2.5 print:py-2 print:px-1.5 text-right font-mono font-black whitespace-nowrap">
                  {itemTableTotals.grossWT.toFixed(3)}g
                </td>
                <td className="py-2.5 px-2.5 print:py-2 print:px-1.5 text-right font-mono whitespace-nowrap">
                  <div>{itemTableTotals.stoneWT.toFixed(3)}g</div>
                  {itemTableTotals.stoneWT > 0 && (
                    <div className="text-[9.5px] print:text-[8px] text-blue-700 font-bold">
                      {(itemTableTotals.stoneWT / 0.2).toFixed(2)}ct
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-2.5 print:py-2 print:px-1.5 text-right font-mono font-black whitespace-nowrap">
                  {itemTableTotals.netWT.toFixed(3)}g
                </td>
                <td className="py-2.5 px-2.5 print:py-2 print:px-1.5 text-right font-mono text-[#647777]">—</td>
                <td className="py-2.5 px-2.5 print:py-2 print:px-1.5 text-right font-mono font-black whitespace-nowrap">
                  {itemTableTotals.pureWT.toFixed(3)}g
                </td>
                <td className="py-2.5 px-2.5 print:py-2 print:px-1.5 text-right font-mono text-[#647777]">—</td>
                <td className="py-2.5 px-3 print:py-2 print:px-2 text-right font-mono font-black text-sm print:text-xs text-[#0F5C5B] whitespace-nowrap">
                  ₹ {itemTableTotals.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Material & Amount Summary (Incl. GST) */}
        <div className="bg-white rounded-xl border border-[#DCE5E3] p-4 print:p-3 shadow-xs space-y-3 break-inside-avoid">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F5C5B] text-white flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-[#173333]">Material & Valuation Summary (Incl. GST)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 print:grid-cols-4 gap-3 text-xs">
            {/* Card 1: Gold Metal Value */}
            <div className="bg-[#FFFDF7] print:bg-[#FFFDF7] rounded-xl border border-[#ECD9A5] p-3.5 print:p-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs print:text-[10.5px]">
                    <Coins className="w-4 h-4 print:w-3.5 print:h-3.5 text-amber-500" />
                    <span>Gold Metal Value</span>
                  </div>
                  <span className="text-[10px] print:text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                    GOLD
                  </span>
                </div>
                <div className="text-lg print:text-base font-black text-[#173333] font-mono leading-tight">
                  ₹ {estimate.totals.goldValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs print:text-[10px] font-bold text-[#173333] font-mono mt-0.5">
                  {(estimate.totals.goldPureWT ?? estimate.totals.totalPureWT).toFixed(3)} g Pure Gold
                </div>
              </div>
              <div className="font-mono text-[10px] print:text-[8.5px] text-[#647777] border-t border-[#ECD9A5]/60 pt-2 mt-2 flex justify-between">
                <span>Net: {(estimate.totals.goldNetWT ?? estimate.totals.totalNetWT).toFixed(3)} g</span>
                <span>Gross: {(estimate.totals.goldGrossWT ?? estimate.totals.totalGrossWT).toFixed(3)} g</span>
              </div>
            </div>

            {/* Card 2: Diamonds & Gemstones */}
            <div className="bg-[#F8FAFD] print:bg-[#F8FAFD] rounded-xl border border-[#BFDBFE] p-3.5 print:p-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs print:text-[10.5px]">
                    <Gem className="w-4 h-4 print:w-3.5 print:h-3.5 text-blue-600" />
                    <span>Diamonds & Gemstones</span>
                  </div>
                  <span className="text-[10px] print:text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                    DMD / PS
                  </span>
                </div>
                <div className="text-lg print:text-base font-black text-[#173333] font-mono leading-tight">
                  ₹ {(estimate.totals.diamondValue + estimate.totals.psValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="font-mono text-[10px] print:text-[8.5px] text-[#647777] border-t border-[#BFDBFE]/60 pt-2 mt-2 flex justify-between">
                <span>DMD: {(estimate.totals.diamondCarats ?? 0).toFixed(2)} ct</span>
                <span>PS: {(estimate.totals.psCarats ?? 0).toFixed(2)} ct</span>
              </div>
            </div>

            {/* Card 3: Making Charges */}
            <div className="bg-[#FAF7FD] print:bg-[#FAF7FD] rounded-xl border border-[#E9D5FF] p-3.5 print:p-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-purple-800 font-bold text-xs print:text-[10.5px]">
                    <Wrench className="w-4 h-4 print:w-3.5 print:h-3.5 text-purple-600" />
                    <span>Making Charges</span>
                  </div>
                  <span className="text-[10px] print:text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 uppercase">
                    MC
                  </span>
                </div>
                <div className="text-lg print:text-base font-black text-purple-900 font-mono leading-tight">
                  ₹ {estimate.totals.mcValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="font-mono text-[10px] print:text-[8.5px] text-[#647777] border-t border-[#E9D5FF]/60 pt-2 mt-2 flex justify-between">
                <span>On Net: {(estimate.totals.goldNetWT && estimate.totals.goldNetWT > 0 ? estimate.totals.goldNetWT : estimate.totals.totalNetWT).toFixed(3)} g</span>
                <span>Rate: ₹ {((estimate.totals.mcValue) / ((estimate.totals.goldNetWT && estimate.totals.goldNetWT > 0 ? estimate.totals.goldNetWT : estimate.totals.totalNetWT) || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/g</span>
              </div>
            </div>

            {/* Card 4: Estimate Amount Summary */}
            <div className="bg-[#F4FBF7] print:bg-[#F4FBF7] rounded-xl border border-[#BBF7D0] p-3.5 print:p-2.5 flex flex-col justify-between space-y-2">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 print:w-3.5 print:h-3.5 text-[#0F5C5B]" />
                <span className="text-xs print:text-[10.5px] font-bold text-[#173333]">Total Estimate Valuation</span>
              </div>
              <div className="space-y-1 text-xs print:text-[9.5px] px-1">
                <div className="flex justify-between items-baseline text-[#647777]">
                  <span className="font-medium text-[#647777]">Taxable Amount:</span>
                  <span className="font-bold font-mono text-[#173333]">
                    ₹ {estimate.totals.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-[#647777]">
                  <span className="font-medium text-[#647777]">GST ({estimate.totals.gstRate || 3}%):</span>
                  <span className="font-bold font-mono text-[#173333]">
                    ₹ {estimate.totals.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="bg-[#FFF8EA] print:bg-[#FFF8EA] rounded-lg px-2.5 py-1.5 border border-[#D9B76C] flex flex-col justify-center">
                <span className="text-[9px] print:text-[8px] font-black text-[#8C6D23] uppercase tracking-wider block">
                  Total Amount (Incl. GST)
                </span>
                <span className="text-base print:text-sm font-black font-mono text-[#0F5C5B] mt-0.5 whitespace-nowrap">
                  ₹ {estimate.totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settlement Configuration and Customer Ledger Balance - Side by Side View (Image 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-4 print:gap-3 items-stretch break-inside-avoid">
          {/* Left Card: Settlement Configuration */}
          <div className="lg:col-span-7 print:col-span-7 bg-white rounded-xl border border-[#DCE5E3] shadow-xs p-4 print:p-3 flex flex-col justify-between space-y-3">
            {/* Screen Header Controls */}
            <div className="no-print flex items-center justify-between gap-3 pb-2.5 border-b border-[#DCE5E3] whitespace-nowrap">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-7 h-7 rounded-lg bg-[#0F5C5B] text-white flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-[#173333]">Settlement Configuration</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-[#647777]">Preset:</span>
                  <select
                    value={activePresetValue}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                  >
                    <option value="B2B_WITHOUT_MC">B2B - Without MC</option>
                    <option value="B2B_WITH_MC">B2B - With MC</option>
                    <option value="ALL_IN_GOLD">All in Gold (100%)</option>
                    <option value="CUSTOM">Custom / Flexible</option>
                    <option value="FIX">FIX (100% Cash)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-[#647777] whitespace-nowrap">
                    Gold Rate
                  </span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      value={unfixGoldRate > 0 ? unfixGoldRate : (Number(estimate.goldRate) > 0 ? estimate.goldRate : '')}
                      onChange={(e) => handleGoldRateChange(parseFloat(e.target.value) || 0)}
                      onFocus={(e) => e.target.select()}
                      placeholder={Number(estimate.goldRate) > 0 ? String(estimate.goldRate) : '0.00'}
                      className="w-28 sm:w-32 text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-l-lg border border-r-0 border-[#DCE5E3] text-[#173333] text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs bg-gray-50 px-2 py-1 border border-[#DCE5E3] rounded-r-lg text-[#647777] font-medium border-l-0">
                      /g
                    </span>
                    {unfixGoldRate > 0 && unfixGoldRate !== Number(estimate.goldRate) ? (
                      <button
                        type="button"
                        title="Reset to invoice gold rate"
                        onClick={() => handleGoldRateChange(0)}
                        className="ml-1 p-1 rounded hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="ml-1 p-1 text-[#647777]">
                        <Pencil className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Print Header (Clean Static Typography) */}
            <div className="hidden print:flex items-center justify-between pb-2 border-b border-[#DCE5E3] text-[10px]">
              <div className="flex items-center gap-1.5 font-bold text-[#173333]">
                <Scale className="w-3.5 h-3.5 text-[#0F5C5B]" />
                <span>Settlement Component Breakdown</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#647777]">
                  Preset: <strong className="text-[#173333] font-semibold">{activePresetLabel}</strong>
                </span>
                <span className="text-[#647777]">
                  • Gold Rate: <strong className="font-mono text-[#0F5C5B] font-bold">₹ {effectiveGoldRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/g</strong>
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full min-w-[550px] print:min-w-0 text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE5E3] text-[10px] font-bold uppercase tracking-wider text-[#647777] bg-gray-50/70">
                    <th className="py-2 px-3">COMPONENT</th>
                    <th className="py-2 px-3">SETTLEMENT MODE</th>
                    <th className="py-2 px-3 text-right">GOLD WT (g)</th>
                    <th className="py-2 px-3 text-right">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5E3]/60 font-medium">
                  {/* 1. Gold Metal Value */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-3 font-semibold text-[#173333]">Gold Metal Value</td>
                    <td className="py-2 px-3">
                      <span className="hidden print:inline-block text-[9.5px] font-semibold text-[#0F5C5B] bg-[#0F5C5B]/10 px-2 py-0.5 rounded">
                        {currentMetalMode === 'GOLD' ? 'In Gold (100%)' : currentMetalMode === 'CASH' ? 'In Cash (100%)' : 'Split'}
                      </span>
                      <div className="no-print">
                        <select
                          value={currentMetalMode}
                          onChange={(e) => updateCustomRow('goldMetalMode', e.target.value)}
                          className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                        >
                          <option value="GOLD">In Gold (100%)</option>
                          <option value="CASH">In Cash (100%)</option>
                          <option value="SPLIT">Split (Grams / Cash)</option>
                        </select>
                      </div>

                      {currentMetalMode === 'SPLIT' && (
                        <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 space-y-1.5 max-w-sm no-print">
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
                                  const upd = {
                                    ...customSettlement,
                                    goldMetalMode: 'SPLIT' as const,
                                    goldPaidInMetalGrams: g,
                                    goldPaidInCashAmount: amt,
                                  };
                                  setCustomSettlement(upd);
                                  if (rawEstimate) {
                                    updateEstimate(rawEstimate.id, {
                                      ...rawEstimate,
                                      settlementMode: 'UNFIX',
                                      unfixPreset: 'CUSTOM',
                                      unfixComponentSettlement: upd,
                                    });
                                  }
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
                                  const upd = {
                                    ...customSettlement,
                                    goldMetalMode: 'SPLIT' as const,
                                    goldPaidInMetalGrams: g,
                                    goldPaidInCashAmount: amt,
                                  };
                                  setCustomSettlement(upd);
                                  if (rawEstimate) {
                                    updateEstimate(rawEstimate.id, {
                                      ...rawEstimate,
                                      settlementMode: 'UNFIX',
                                      unfixPreset: 'CUSTOM',
                                      unfixComponentSettlement: upd,
                                    });
                                  }
                                }}
                                className="w-full text-xs font-mono font-bold py-1 px-1.5 bg-white rounded border border-amber-300 text-amber-900 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
                      {currentMetalMode === 'GOLD'
                        ? goldPureToAdjust.toFixed(3)
                        : currentMetalMode === 'SPLIT'
                        ? (customSettlement.goldPaidInMetalGrams || 0).toFixed(3)
                        : '0.000'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
                      ₹ {goldMetalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* 2. Gold GST (3%) */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-3 font-semibold text-[#173333]">Gold GST (3%)</td>
                    <td className="py-2 px-3">
                      <span className="hidden print:inline-block text-[9.5px] font-semibold text-[#0F5C5B] bg-[#0F5C5B]/10 px-2 py-0.5 rounded">
                        {currentGoldGstMode === 'GOLD' ? 'In Gold' : 'In Cash'}
                      </span>
                      <div className="no-print">
                        <select
                          value={currentGoldGstMode}
                          onChange={(e) => updateCustomRow('goldGSTMode', e.target.value)}
                          className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                        >
                          <option value="GOLD">In Gold</option>
                          <option value="CASH">In Cash</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
                      {currentGoldGstMode === 'GOLD' ? goldGstGrams.toFixed(3) : '0.000'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
                      ₹ {goldGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* 3. Making Charges */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-3 font-semibold text-[#173333]">Making Charges</td>
                    <td className="py-2 px-3">
                      <span className="hidden print:inline-block text-[9.5px] font-semibold text-[#0F5C5B] bg-[#0F5C5B]/10 px-2 py-0.5 rounded">
                        {currentMcMode === 'GOLD' ? 'In Gold' : 'In Cash'}
                      </span>
                      <div className="no-print">
                        <select
                          value={currentMcMode}
                          onChange={(e) => updateCustomRow('mcMode', e.target.value)}
                          className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                        >
                          <option value="CASH">In Cash</option>
                          <option value="GOLD">In Gold</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
                      {currentMcMode === 'GOLD' ? mcGrams.toFixed(3) : '0.000'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
                      ₹ {mcValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* 4. Stones / Diamonds */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-3 font-semibold text-[#173333]">Stones / Diamonds</td>
                    <td className="py-2 px-3">
                      <span className="hidden print:inline-block text-[9.5px] font-semibold text-[#0F5C5B] bg-[#0F5C5B]/10 px-2 py-0.5 rounded">
                        {currentStonesMode === 'GOLD' ? 'In Gold' : 'In Cash'}
                      </span>
                      <div className="no-print">
                        <select
                          value={currentStonesMode}
                          onChange={(e) => updateCustomRow('stonesMode', e.target.value)}
                          className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                        >
                          <option value="CASH">In Cash</option>
                          <option value="GOLD">In Gold</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
                      {currentStonesMode === 'GOLD' ? stonesGrams.toFixed(3) : '0.000'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
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
                          className="no-print text-[10px] text-[#0F5C5B] font-bold hover:underline cursor-pointer flex items-center gap-1 bg-[#0F5C5B]/5 px-1.5 py-0.5 rounded border border-[#0F5C5B]/20"
                        >
                          <span>{expensesTotal > 0 ? `₹${expensesTotal}` : '+ Add'}</span>
                          <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showExpensesSection ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="hidden print:inline-block text-[9.5px] font-semibold text-[#0F5C5B] bg-[#0F5C5B]/10 px-2 py-0.5 rounded">
                        {currentExpensesMode === 'GOLD' ? 'In Gold' : 'In Cash'}
                      </span>
                      <div className="no-print">
                        <select
                          value={currentExpensesMode}
                          onChange={(e) => updateCustomRow('expensesMode', e.target.value)}
                          className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                        >
                          <option value="CASH">In Cash</option>
                          <option value="GOLD">In Gold</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
                      {currentExpensesMode === 'GOLD' ? expensesGrams.toFixed(3) : '0.000'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
                      ₹ {expensesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Expandable Additional Expenses Inputs */}
                  {showExpensesSection && (
                    <tr className="bg-gray-50 no-print">
                      <td colSpan={4} className="p-3 border-t border-b border-[#DCE5E3]">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                          <SBGInput
                            label="HUID Charges (₹)"
                            type="number"
                            step="1"
                            placeholder="0.00"
                            value={huidCharges || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setHuidCharges(val);
                              if (rawEstimate) {
                                updateEstimate(rawEstimate.id, {
                                  ...rawEstimate,
                                  additionalExpenses: {
                                    ...rawEstimate.additionalExpenses,
                                    huidCharges: val,
                                  },
                                });
                              }
                            }}
                          />
                          <SBGInput
                            label="Courier (₹)"
                            type="number"
                            step="1"
                            placeholder="0.00"
                            value={courierCharges || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setCourierCharges(val);
                              if (rawEstimate) {
                                updateEstimate(rawEstimate.id, {
                                  ...rawEstimate,
                                  additionalExpenses: {
                                    ...rawEstimate.additionalExpenses,
                                    courierCharges: val,
                                  },
                                });
                              }
                            }}
                          />
                          <SBGInput
                            label="Other Charges (₹)"
                            type="number"
                            step="1"
                            placeholder="0.00"
                            value={otherCharges || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setOtherCharges(val);
                              if (rawEstimate) {
                                updateEstimate(rawEstimate.id, {
                                  ...rawEstimate,
                                  additionalExpenses: {
                                    ...rawEstimate.additionalExpenses,
                                    otherCharges: val,
                                  },
                                });
                              }
                            }}
                          />
                          <SBGInput
                            label="Remarks"
                            type="text"
                            placeholder="e.g. Hallmarking"
                            value={otherChargesRemarks}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOtherChargesRemarks(val);
                              if (rawEstimate) {
                                updateEstimate(rawEstimate.id, {
                                  ...rawEstimate,
                                  additionalExpenses: {
                                    ...rawEstimate.additionalExpenses,
                                    otherChargesRemarks: val,
                                  },
                                });
                              }
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* 6. Other GST (3%) */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2 px-3 font-semibold text-[#173333]">Other GST (3%)</td>
                    <td className="py-2 px-3">
                      <span className="hidden print:inline-block text-[9.5px] font-semibold text-[#0F5C5B] bg-[#0F5C5B]/10 px-2 py-0.5 rounded">
                        {currentOtherGstMode === 'GOLD' ? 'In Gold' : 'In Cash'}
                      </span>
                      <div className="no-print">
                        <select
                          value={currentOtherGstMode}
                          onChange={(e) => updateCustomRow('otherGstMode', e.target.value)}
                          className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-[#DCE5E3] text-[#173333] cursor-pointer"
                        >
                          <option value="CASH">In Cash</option>
                          <option value="GOLD">In Gold</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
                      {currentOtherGstMode === 'GOLD' ? otherGstGrams.toFixed(3) : '0.000'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#173333]">
                      ₹ {otherGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#DCE5E3] bg-[#FAF9F5] font-bold">
                    <td className="py-2.5 px-3 text-[#173333] font-bold text-xs" colSpan={2}>
                      Total to Settle
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-[#173333]">
                      {settledGoldWT.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-xs text-[#173333]">
                      ₹ {settledCashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Right Card: Customer Ledger Balance Adjustment */}
          <div className="lg:col-span-5 print:col-span-5 bg-white rounded-xl border border-[#DCE5E3] shadow-xs p-4 print:p-3 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#DCE5E3]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0F5C5B] text-white flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-[#173333]">Customer Ledger Balance Adjustment</span>
                </div>

                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-[#647777]">
                    Account: <strong className="text-[#173333] font-semibold">{customer?.name || estimate.customerName} ({customer?.code || 'ACC'})</strong>
                  </span>
                  <span className="text-[#173333] font-semibold">
                    {isPurchase ? 'Purchase (Receipt −)' : 'Sale (Issue +)'}
                  </span>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-hidden rounded-xl border border-[#DCE5E3] bg-white">
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
                      <td className="py-2.5 px-3.5 text-[#173333] font-semibold">
                        Previous Balance
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-xs text-[#173333] border-l border-[#DCE5E3]/60">
                        {prevWT < 0 ? '−' : prevWT > 0 ? '+' : ''}{Math.abs(prevWT).toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-right pr-4 font-mono font-bold text-xs text-[#173333] border-l border-[#DCE5E3]/60 whitespace-nowrap">
                        {prevMC < 0 ? '− ₹ ' : prevMC > 0 ? '+ ₹ ' : '₹ '}{Math.abs(prevMC).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* Row 2: Estimate Impact */}
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-3.5 text-[#173333] font-semibold">
                        Estimate Impact ({isPurchase ? '−' : '+'})
                      </td>
                      <td className={`py-2.5 px-3 text-center font-mono font-bold text-xs border-l border-[#DCE5E3]/60 ${isPurchase ? 'text-rose-600' : 'text-[#0F5C5B]'}`}>
                        {displayDeltaPureWT >= 0 ? '+' : '−'}{Math.abs(displayDeltaPureWT).toFixed(3)}
                      </td>
                      <td className={`py-2.5 px-3 text-right pr-4 font-mono font-bold text-xs border-l border-[#DCE5E3]/60 whitespace-nowrap ${isPurchase ? 'text-rose-600' : 'text-[#0F5C5B]'}`}>
                        {displayDeltaAmount >= 0 ? '+ ₹ ' : '− ₹ '}{Math.abs(displayDeltaAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* Row 3: New Balance (Hero Highlight Row) */}
                    <tr className="bg-[#FFF8EA] border-t-2 border-[#D9B76C]/40">
                      <td className="py-3 px-3.5 font-black text-sm text-[#173333]">
                        New Balance
                      </td>
                      <td className={`py-3 px-3 text-center font-mono font-black text-base border-l border-[#DCE5E3]/60 ${newBalWT < 0 ? 'text-rose-600' : 'text-[#0F5C5B]'}`}>
                        {newBalWT < 0 ? '−' : newBalWT > 0 ? '+' : ''}{Math.abs(newBalWT).toFixed(3)}
                      </td>
                      <td className={`py-3 px-3 text-right pr-4 font-mono font-black text-base border-l border-[#DCE5E3]/60 whitespace-nowrap ${newBalMC < 0 ? 'text-rose-600' : 'text-[#0F5C5B]'}`}>
                        {newBalMC < 0 ? '− ₹ ' : newBalMC > 0 ? '+ ₹ ' : '₹ '}{Math.abs(newBalMC).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Print Signatures & Declarations Footer */}
        <div className="pt-6 print:pt-4 border-t-2 border-[#0F5C5B]/20 break-inside-avoid">
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 items-end text-xs">
            {/* Left: System Reference & Purity Benchmark */}
            <div className="space-y-1 text-[#647777] text-[10px] print:text-[9px]">
              <div className="flex items-center gap-1.5 font-bold text-[#0F5C5B]">
                <Scale className="w-3.5 h-3.5" />
                <span>Commercial Estimate & Cost Sheet</span>
              </div>
              <p className="text-[10px] print:text-[8.5px]">
                All pure gold calculations are benchmarked against 99.9% 24K fine bullion purity.
              </p>
              <div className="text-[9.5px] print:text-[8px] font-mono text-[#8C6D23] pt-0.5">
                Ref: {estimate.estimateNo} • Date: {formatDateDDMMYYYY(estimate.estimateDate)}
              </div>
            </div>

            {/* Right: Signature Blocks */}
            <div className="flex justify-end gap-8 text-right">
              <div className="space-y-8 text-center">
                <div className="text-[10px] print:text-[8.5px] text-[#647777] font-medium">
                  Customer Confirmation
                </div>
                <div className="border-t border-[#173333]/40 pt-1 w-36 text-center text-[10px] print:text-[8.5px] font-semibold text-[#173333]">
                  Receiver's Signature
                </div>
              </div>

              <div className="space-y-8 text-center">
                <div className="text-[10px] print:text-[8.5px] text-[#647777] font-medium">
                  For <strong className="text-[#0F5C5B] font-bold">SREE BALAJI GOLD</strong>
                </div>
                <div className="border-t border-[#173333]/40 pt-1 w-40 text-center text-[10px] print:text-[8.5px] font-bold text-[#0F5C5B]">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <SBGModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Estimate & Update Customer Ledger"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#647777]">
            Confirming this estimate will post a permanent transaction to the Customer Ledger for{' '}
            <strong className="text-[#173333]">{customer?.name || estimate.customerName}</strong> and adjust their running balances.
          </p>

          <div className="bg-[#0F5C5B]/5 p-4 rounded-2xl border border-[#0F5C5B]/20 space-y-3">
            <h5 className="text-xs font-bold uppercase text-[#0F5C5B]">Ledger Impact Preview</h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-[#DCE5E3] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#647777] block">Pure Gold (WT)</span>
                <div className="flex justify-between text-[#647777]">
                  <span>Previous:</span>
                  <span className="font-mono">{prevWT.toFixed(3)} g</span>
                </div>
                <div className={`flex justify-between font-bold ${isPurchase ? 'text-amber-800' : 'text-[#0F5C5B]'}`}>
                  <span>{isPurchase ? 'Purchase Adjustment:' : 'Sale Adjustment:'}</span>
                  <span className="font-mono">{deltaPureWT >= 0 ? '+' : '−'}{Math.abs(deltaPureWT).toFixed(3)} g</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#DCE5E3] font-bold text-[#173333]">
                  <span>New Balance:</span>
                  <span className="font-mono text-[#0F5C5B]">{newWT.toFixed(3)} g</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#DCE5E3] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#647777] block">Cash / MC Balance (₹)</span>
                <div className="flex justify-between text-[#647777]">
                  <span>Previous:</span>
                  <span className="font-mono"><SBGCurrency value={prevMC} /></span>
                </div>
                <div className={`flex justify-between font-bold ${isPurchase ? 'text-amber-800' : 'text-[#0F5C5B]'}`}>
                  <span>{isPurchase ? 'Purchase Adjustment:' : 'Sale Adjustment:'}</span>
                  <span className="font-mono">{deltaMC >= 0 ? '+' : '−'}<SBGCurrency value={Math.abs(deltaMC)} /></span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#DCE5E3] font-bold text-[#173333]">
                  <span>New Balance:</span>
                  <span className="font-mono text-[#0F5C5B]"><SBGCurrency value={newMC} /></span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <SBGButton variant="outline" size="sm" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </SBGButton>
            <SBGButton variant="primary" size="sm" icon={<FileCheck className="w-4 h-4" />} onClick={handleConfirmAndPost}>
              Confirm & Post to Ledger
            </SBGButton>
          </div>
        </div>
      </SBGModal>

      {/* Reopen to Draft Modal */}
      <SBGModal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        title="Reopen Estimate to Draft"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#647777]">
            Reopening estimate <strong className="text-[#173333]">{estimate.estimateNo}</strong> will remove its corresponding entry from the Customer Ledger of{' '}
            <strong className="text-[#173333]">{customer?.name || estimate.customerName}</strong> and revert balances back to their previous state.
          </p>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Customer running balances will be automatically recalculated immediately.</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <SBGButton variant="outline" size="sm" onClick={() => setIsReopenModalOpen(false)}>
              Cancel
            </SBGButton>
            <SBGButton variant="danger" size="sm" icon={<RotateCcw className="w-4 h-4" />} onClick={handleReopenToDraft}>
              Revert to Draft & Remove from Ledger
            </SBGButton>
          </div>
        </div>
      </SBGModal>

      {/* Delete Confirmation Modal */}
      <SBGModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Estimate Cost Sheet"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              Delete Confirmation
            </div>
            <p>
              Are you sure you want to permanently delete estimate <strong className="font-mono font-bold">{rawEstimate.estimateNo}</strong> for{' '}
              <strong>{customer?.name || estimate.customerName}</strong>?
            </p>
            {rawEstimate.status === 'CONFIRMED' && (
              <p className="font-semibold text-rose-800 pt-1 border-t border-rose-200">
                Notice: This estimate is currently CONFIRMED. Deleting it will also remove its corresponding transaction from the Customer Ledger and restore previous balances automatically.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <SBGButton variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </SBGButton>
            <SBGButton
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDeleteEstimate}
            >
              Permanently Delete Estimate
            </SBGButton>
          </div>
        </div>
      </SBGModal>
    </div>
  );
};
