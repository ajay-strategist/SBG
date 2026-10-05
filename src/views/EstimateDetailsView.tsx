import React, { useState, useMemo } from 'react';
import { useSBG } from '../store/sbgStore';
import { calculateEstimateSheet } from '../core/calculations/estimateEngine';
import { roundWeight, roundCurrency } from '../core/calculations/mathUtils';
import {
  SBGCard,
  SBGButton,
  SBGBadge,
  SBGCurrency,
  SBGWeight,
  SBGModal,
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
} from 'lucide-react';
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

  // Dynamically recalculate sheet so category breakdowns & deltas are always live and accurate
  const estimate = useMemo(() => {
    if (!rawEstimate) return rawEstimate;
    return calculateEstimateSheet(
      {
        ...rawEstimate,
        transactionType: rawEstimate.transactionType || (rawEstimate.direction === 'ISSUE' ? 'SALE' : 'PURCHASE'),
        direction: rawEstimate.direction || (rawEstimate.transactionType === 'SALE' ? 'ISSUE' : 'RECEIPT'),
        settlementMode: rawEstimate.settlementMode || 'GOLD_AND_CASH',
      },
      rawEstimate.totals?.gstRate ?? 3.0
    );
  }, [rawEstimate]);

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

  // Determine transaction nature & components
  const isPurchase = estimate.transactionType === 'PURCHASE' || estimate.direction === 'RECEIPT';
  const goldPureWT = (estimate.totals.goldPureWT && estimate.totals.goldPureWT > 0)
    ? estimate.totals.goldPureWT
    : estimate.items.filter((i) => i.category === 'GOLD').reduce((sum, i) => sum + (i.pureWT || 0), 0);
  const remainingCash = estimate.totals.remainingCashValue ?? Math.max(0, estimate.totals.grandTotal - (estimate.totals.goldValue ?? 0));

  const deltaPureWT = estimate.settlementMode === 'CASH_ONLY'
    ? 0
    : (isPurchase ? -goldPureWT : goldPureWT);

  const deltaMC = estimate.settlementMode === 'CASH_ONLY'
    ? (isPurchase ? -estimate.totals.grandTotal : estimate.totals.grandTotal)
    : (isPurchase ? -remainingCash : remainingCash);

  const handleToggleTransactionType = async (newType: 'PURCHASE' | 'SALE') => {
    if (!rawEstimate) return;
    const isNowPurchase = newType === 'PURCHASE';
    const newDirection = isNowPurchase ? 'RECEIPT' : 'ISSUE';

    const goldPureToAdjust = estimate.totals.goldPureWT ?? estimate.totals.totalPureWT;
    const remainingCashToAdjust = estimate.totals.remainingCashValue ?? Math.max(0, estimate.totals.grandTotal - (estimate.totals.goldValue ?? 0));

    const newDeltaPureWT = isNowPurchase ? -goldPureToAdjust : goldPureToAdjust;
    const newDeltaAmount = isNowPurchase ? -remainingCashToAdjust : remainingCashToAdjust;

    const prevWT = rawEstimate.previousBalanceWT ?? customer?.currentWT ?? 0;
    const prevMC = rawEstimate.previousBalanceMC ?? customer?.currentMC ?? 0;

    const newBalWT = Number((prevWT + newDeltaPureWT).toFixed(3));
    const newBalMC = Number((prevMC + newDeltaAmount).toFixed(2));

    await updateEstimate(rawEstimate.id, {
      ...rawEstimate,
      transactionType: newType,
      direction: newDirection,
      deltaPureWT: newDeltaPureWT,
      deltaAmount: newDeltaAmount,
      newBalanceWT: newBalWT,
      newBalanceMC: newBalMC,
      balanceComparison: {
        ...rawEstimate.balanceComparison,
        ledgerOldPureWT: prevWT,
        ledgerOldAmount: prevMC,
        ledgerNewPureWT: newBalWT,
        ledgerNewAmount: newBalMC,
        deltaPureWT: newDeltaPureWT,
        deltaAmount: newDeltaAmount,
        pureWTDiff: 0,
        amountDiff: 0,
        isReconciled: true,
      },
    });

    setShowToast(`Estimate ${rawEstimate.estimateNo} switched to ${newType}! ${isNowPurchase ? 'Balances adjusted in Negative (−).' : 'Balances adjusted in Positive (+).'}`);
    setTimeout(() => setShowToast(null), 5000);
  };

  const handleDeleteEstimate = async () => {
    if (!rawEstimate) return;
    await deleteEstimate(rawEstimate.id);
    setIsDeleteModalOpen(false);
    onNavigate('estimates');
  };

  // Accurate balance determination
  let prevWT: number;
  let prevMC: number;
  let newWT: number;
  let newMC: number;

  if (estimate.status === 'CONFIRMED' && linkedTx) {
    newWT = linkedTx.balanceWT;
    newMC = linkedTx.balanceMC;
    prevWT = estimate.previousBalanceWT !== undefined
      ? estimate.previousBalanceWT
      : Number((newWT - linkedTx.pureWT).toFixed(3));
    prevMC = estimate.previousBalanceMC !== undefined
      ? estimate.previousBalanceMC
      : Number((newMC - linkedTx.totalAmount).toFixed(2));
  } else if (estimate.previousBalanceWT !== undefined && estimate.previousBalanceMC !== undefined) {
    prevWT = estimate.previousBalanceWT;
    prevMC = estimate.previousBalanceMC;
    newWT = estimate.newBalanceWT ?? Number((prevWT + deltaPureWT).toFixed(3));
    newMC = estimate.newBalanceMC ?? Number((prevMC + deltaMC).toFixed(2));
  } else if (estimate.balanceComparison?.ledgerOldPureWT !== undefined) {
    prevWT = estimate.balanceComparison.ledgerOldPureWT;
    prevMC = estimate.balanceComparison.ledgerOldAmount;
    newWT = estimate.balanceComparison.ledgerNewPureWT ?? Number((prevWT + deltaPureWT).toFixed(3));
    newMC = estimate.balanceComparison.ledgerNewAmount ?? Number((prevMC + deltaMC).toFixed(2));
  } else {
    prevWT = customer?.currentWT ?? 0;
    prevMC = customer?.currentMC ?? 0;
    newWT = Number((prevWT + deltaPureWT).toFixed(3));
    newMC = Number((prevMC + deltaMC).toFixed(2));
  }

  const currentPureWT = estimate.totals.totalPureWT;
  const currentGrandTotal = estimate.totals.grandTotal;

  const handlePrint = () => {
    window.print();
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

      {/* Validation Checklist & Balance Impact Banner Panel */}
      <div className="glass-panel p-5 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#DCE5E3] pb-3 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B]">
              Estimate Balance Impact & Ledger Verification
            </h3>
            <SBGBadge variant={estimate.status === 'CONFIRMED' ? 'success' : 'warning'}>
              {estimate.status === 'CONFIRMED' ? 'In Customer Ledger' : 'Draft Estimate'}
            </SBGBadge>
          </div>
          <span className="text-xs text-[#647777]">
            Account: <strong>{customer?.name || estimate.customerName}</strong> | Closing Gold:{' '}
            <strong className="text-[#0F5C5B]">{newWT.toFixed(3)}g</strong> | Closing Amount:{' '}
            <strong className="text-[#0F5C5B]">₹{newMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          {[
            { label: 'Prev Gold WT', value: `${prevWT.toFixed(3)}g`, color: 'text-[#647777]' },
            { label: 'Prev Cash Balance', value: `₹${prevMC.toLocaleString('en-IN')}`, color: 'text-[#647777]' },
            {
              label: `${isPurchase ? '−' : '+'} Pure Gold Adjusted`,
              value: `${deltaPureWT >= 0 ? '+' : '−'}${Math.abs(deltaPureWT).toFixed(3)}g`,
              color: isPurchase ? 'text-amber-800 font-bold' : 'text-[#0F5C5B] font-bold',
            },
            {
              label: `${isPurchase ? '−' : '+'} Remaining Cash`,
              value: `${deltaMC >= 0 ? '+' : '−'}₹${Math.abs(deltaMC).toLocaleString('en-IN')}`,
              color: isPurchase ? 'text-amber-800 font-bold' : 'text-[#0F5C5B] font-bold',
            },
            { label: '= New Gold Balance', value: `${newWT.toFixed(3)}g`, color: 'text-[#0F5C5B] font-bold' },
            { label: '= New Cash Balance', value: `₹${newMC.toLocaleString('en-IN')}`, color: 'text-[#0F5C5B] font-bold' },
          ].map((chk, i) => (
            <div key={i} className="bg-white/80 p-2.5 rounded-xl border border-white/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#647777] uppercase block">{chk.label}</span>
                <span className={`font-mono text-xs ${chk.color}`}>{chk.value}</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#3E8B68]" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Printable Estimate Cost Sheet */}
      <div className="glass-panel p-6 sm:p-10 space-y-8 bg-white/90 shadow-lg print:shadow-none print:border-none print:p-0">
        {/* Top Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#DCE5E3] pb-6 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <img src="/sbg-logo.png" alt="Sree Balaji Gold" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-wider text-[#0F5C5B]">SREE BALAJI GOLD</span>
                <SBGBadge variant={isPurchase ? 'teal' : 'gold'}>
                  {isPurchase ? 'PURCHASE / RECEIPT' : 'SALE / ISSUE'}
                </SBGBadge>
                <SBGBadge variant="gold">COST SHEET</SBGBadge>
              </div>
              <p className="text-xs text-[#647777]">
                Makers of 22carat Handcrafted Gold Ornaments & Commercial Jewellery
              </p>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1 text-xs">
            <div className="text-base font-mono font-bold text-[#0F5C5B]">{estimate.estimateNo}</div>
            <div className="text-[#647777]">Date: <strong className="text-[#173333]">{estimate.estimateDate}</strong></div>
            {estimate.customerRef && (
              <div className="text-[#647777]">Customer Ref: <strong className="text-[#173333]">{estimate.customerRef}</strong></div>
            )}
            {estimate.orderRef && (
              <div className="text-[#647777]">Order: <strong className="text-[#0F5C5B]">{estimate.orderRef}</strong></div>
            )}
          </div>
        </div>

        {/* Customer & Metal Rates Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0F5C5B]/5 p-5 rounded-2xl border border-[#0F5C5B]/15">
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold text-[#647777] uppercase tracking-wider block">
              Billed To Customer
            </span>
            <h4 className="text-base font-bold text-[#0F5C5B]">{customer?.name || estimate.customerName}</h4>
            <p className="text-[#647777]">{customer?.phone} | {customer?.city || 'Mumbai, Maharashtra'}</p>
            {customer?.gstin && <p className="font-mono text-[11px]">GSTIN: {customer.gstin}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs md:text-right">
            <div>
              <span className="text-[10px] font-bold text-[#647777] uppercase tracking-wider block">
                Applied Gold Rate
              </span>
              <span className="font-mono font-bold text-sm text-[#173333]">
                ₹{estimate.goldRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g
              </span>
              <span className="text-[10px] text-[#647777] block">Purity: {estimate.goldRatePurity}%</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#647777] uppercase tracking-wider block">
                Purity Status
              </span>
              <span className="font-semibold text-[#0F5C5B]">
                {estimate.touchFixed ? 'Touch Fixed' : 'Unfixed Rate'}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F5C5B]/5 text-[#647777] border-b border-[#DCE5E3] uppercase font-bold text-[10px]">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Item Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Nos</th>
                <th className="py-3 px-3 text-right">Gross WT</th>
                <th className="py-3 px-3 text-right">Stone WT</th>
                <th className="py-3 px-3 text-right">Net WT</th>
                <th className="py-3 px-3 text-right">Touch</th>
                <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">Pure WT</th>
                <th className="py-3 px-3 text-right">Rate</th>
                <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5E3]/60">
              {estimate.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="py-3 px-3 font-mono text-[#647777]">{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-[#173333]">{item.item}</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] bg-black/5 px-2 py-0.5 rounded font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{item.nos}</td>
                  <td className="py-3 px-3 text-right font-mono">{item.grossWT.toFixed(3)}g</td>
                  <td className="py-3 px-3 text-right font-mono text-[#647777]">
                    {item.stoneWT.toFixed(3)}g
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{item.netWT.toFixed(3)}g</td>
                  <td className="py-3 px-3 text-right font-mono">{item.touch.toFixed(2)}%</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#0F5C5B]">
                    {item.pureWT.toFixed(3)}g
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#647777]">
                    ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{item.rateUnit === 'PER_CT' ? '/ct' : item.rateUnit === 'PER_G' ? '/g' : ''}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-sm text-[#0F5C5B]">
                    <SBGCurrency value={item.amount} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-[#0F5C5B] bg-[#0F5C5B]/5 font-mono font-bold text-xs">
              <tr>
                <td colSpan={3} className="py-2.5 px-3 font-sans font-bold text-[#0F5C5B] text-right uppercase text-[10px]">
                  Total Pure WT & Sheet Summary:
                </td>
                <td className="py-2.5 px-3 text-right">
                  {estimate.items.reduce((sum, it) => sum + (Number(it.nos) || 0), 0)}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {estimate.totals.totalGrossWT.toFixed(3)}g
                </td>
                <td className="py-2.5 px-3 text-right text-[#647777]">
                  {estimate.totals.totalStoneWT.toFixed(3)}g
                </td>
                <td className="py-2.5 px-3 text-right text-[#173333]">
                  {estimate.totals.totalNetWT.toFixed(3)}g
                </td>
                <td className="py-2.5 px-3 text-right text-[#647777] text-[10px]">
                  {estimate.totals.totalNetWT > 0
                    ? ((estimate.totals.totalPureWT / estimate.totals.totalNetWT) * 100).toFixed(2) + '%'
                    : '-'}
                </td>
                <td className="py-2.5 px-3 text-right text-[#0F5C5B] text-sm font-black">
                  {estimate.totals.totalPureWT.toFixed(3)}g
                </td>
                <td className="py-2.5 px-3 text-right font-sans font-semibold text-[10px] text-[#647777]">
                  Taxable Total:
                </td>
                <td className="py-2.5 px-3 text-right text-[#0F5C5B] text-sm font-black">
                  <SBGCurrency value={estimate.totals.taxableValue} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pure Weight & Material Matrix Banner */}
        <div className="p-4 bg-white/95 rounded-2xl border border-[#DCE5E3] shadow-xs space-y-3">
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
                  Breakdown across Fine Gold, Diamond carats, and Gemstones
                </span>
              </div>
            </div>

            {/* Total Amount in Banner Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#647777] uppercase">Total Amount:</span>
              <span className="font-mono font-black text-base text-[#0F5C5B] px-3 py-1 bg-[#0F5C5B]/10 border border-[#0F5C5B]/20 rounded-lg">
                <SBGCurrency value={estimate.totals.grandTotal} />
              </span>
            </div>
          </div>

          {(() => {
            const displayGoldPure = (estimate.totals.goldPureWT && estimate.totals.goldPureWT > 0)
              ? estimate.totals.goldPureWT
              : estimate.items.filter((i) => {
                  const cat = String(i.category || '').toUpperCase();
                  return cat === 'GOLD' || cat.includes('GOLD') || cat === 'GLD' || (i.touch || 0) > 0;
                }).reduce((sum, i) => sum + (i.pureWT || 0), 0);

            const displayGoldNet = (estimate.totals.goldNetWT && estimate.totals.goldNetWT > 0)
              ? estimate.totals.goldNetWT
              : estimate.items.filter((i) => {
                  const cat = String(i.category || '').toUpperCase();
                  return cat === 'GOLD' || cat.includes('GOLD') || cat === 'GLD' || (i.touch || 0) > 0;
                }).reduce((sum, i) => sum + (i.netWT || 0), 0);

            const displayGoldGross = (estimate.totals.goldGrossWT && estimate.totals.goldGrossWT > 0)
              ? estimate.totals.goldGrossWT
              : estimate.items.filter((i) => {
                  const cat = String(i.category || '').toUpperCase();
                  return cat === 'GOLD' || cat.includes('GOLD') || cat === 'GLD' || (i.touch || 0) > 0;
                }).reduce((sum, i) => sum + (i.grossWT || 0), 0);

            const displayGoldVal = (estimate.totals.goldValue && estimate.totals.goldValue > 0)
              ? estimate.totals.goldValue
              : estimate.items.filter((i) => {
                  const cat = String(i.category || '').toUpperCase();
                  return cat === 'GOLD' || cat.includes('GOLD') || cat === 'GLD' || (i.touch || 0) > 0;
                }).reduce((sum, i) => sum + (i.amount || 0), 0);

            const displayDmdVal = (estimate.totals.diamondValue && estimate.totals.diamondValue > 0)
              ? estimate.totals.diamondValue
              : estimate.items.filter((i) => {
                  const cat = String(i.category || '').toUpperCase();
                  return cat === 'DIAMOND' || cat.includes('DIAMOND') || cat === 'DMD';
                }).reduce((sum, i) => sum + (i.amount || 0), 0);

            const displayDmdCarats = (estimate.totals.diamondCarats && estimate.totals.diamondCarats > 0)
              ? estimate.totals.diamondCarats
              : estimate.items.filter((i) => {
                  const cat = String(i.category || '').toUpperCase();
                  return cat === 'DIAMOND' || cat.includes('DIAMOND') || cat === 'DMD';
                }).reduce((sum, i) => sum + (i.stoneWTCarats || (i.rateUnit === 'PER_CT' ? (i.grossWT || 0) : ((i.stoneWT || 0) / 0.2))), 0);

            const displayPsVal = (estimate.totals.psValue && estimate.totals.psValue > 0)
              ? estimate.totals.psValue
              : estimate.items.filter((i) => {
                  const cat = String(i.category || '').toUpperCase();
                  return cat === 'PRECIOUS_STONE' || cat.includes('PRECIOUS') || cat.includes('STONE') || cat === 'PS';
                }).reduce((sum, i) => sum + (i.amount || 0), 0);

            const displayPsPure = (estimate.totals.psPureWT && estimate.totals.psPureWT > 0)
              ? estimate.totals.psPureWT
              : estimate.items.filter((i) => {
                  const cat = String(i.category || '').toUpperCase();
                  return cat === 'PRECIOUS_STONE' || cat.includes('PRECIOUS') || cat.includes('STONE') || cat === 'PS';
                }).reduce((sum, i) => sum + (i.pureWT || 0), 0);

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Gold Breakdown */}
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#8C6A23]">Gold Metal</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">GOLD</span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#647777]">Pure Gold WT:</span>
                        <span className="font-bold text-[#0F5C5B] text-xs">{displayGoldPure.toFixed(3)} g</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#647777]">
                        <span>Net Gold WT:</span>
                        <span>{displayGoldNet.toFixed(3)} g</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#647777]">
                        <span>Gross WT:</span>
                        <span>{displayGoldGross.toFixed(3)} g</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-amber-500/20 flex justify-between items-center text-xs font-bold">
                    <span className="text-[#8C6A23] text-[10px] uppercase">Total Amount:</span>
                    <span className="font-mono text-[#0F5C5B]">
                      <SBGCurrency value={displayGoldVal} />
                    </span>
                  </div>
                </div>

                {/* Diamonds Breakdown */}
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-blue-800 flex items-center gap-1">
                        <Gem className="w-3 h-3" /> Diamonds
                      </span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">DMD</span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#647777]">Total Carats:</span>
                        <span className="font-bold text-[#173333] text-xs">{displayDmdCarats.toFixed(2)} ct</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#647777]">
                        <span>Stone WT:</span>
                        <span>{(estimate.totals.diamondStoneWT ?? 0).toFixed(3)} g</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-[#647777]">Pure WT:</span>
                        <span className={(estimate.totals.diamondPureWT ?? 0) > 0 ? "font-bold text-[#0F5C5B]" : "text-[#647777]"}>
                          {(estimate.totals.diamondPureWT ?? 0).toFixed(3)} g
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-blue-500/20 flex justify-between items-center text-xs font-bold">
                    <span className="text-blue-800 text-[10px] uppercase">Total Amount:</span>
                    <span className="font-mono text-blue-900">
                      <SBGCurrency value={displayDmdVal} />
                    </span>
                  </div>
                </div>

                {/* Gemstones / PS Breakdown */}
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Gemstones / PS
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">PS</span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#647777]">Pure WT:</span>
                        <span className="font-bold text-[#0F5C5B] text-xs">{displayPsPure.toFixed(3)} g</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#647777]">
                        <span>Carats:</span>
                        <span className="font-semibold text-[#173333]">{(estimate.totals.psCarats ?? 0).toFixed(2)} ct</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#647777]">
                        <span>Stone WT:</span>
                        <span>{(estimate.totals.psStoneWT ?? 0).toFixed(3)} g</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-emerald-500/20 flex justify-between items-center text-xs font-bold">
                    <span className="text-emerald-800 text-[10px] uppercase">Total Amount:</span>
                    <span className="font-mono text-emerald-900">
                      <SBGCurrency value={displayPsVal} />
                    </span>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="p-3 rounded-xl bg-[#0F5C5B]/5 border border-[#0F5C5B]/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#0F5C5B]">Total Summary</span>
                      <span className="text-[10px] font-bold text-[#0F5C5B] bg-[#0F5C5B]/10 px-1.5 py-0.5 rounded">GRAND TOTAL</span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#647777]">Net Pure Gold:</span>
                        <span className="font-black text-[#0F5C5B] text-xs">+{estimate.totals.totalPureWT.toFixed(3)} g</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#647777]">
                        <span>Taxable Value:</span>
                        <span className="font-bold text-[#173333]"><SBGCurrency value={estimate.totals.taxableValue} /></span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#647777]">
                        <span>GST ({estimate.totals.gstRate}%):</span>
                        <span><SBGCurrency value={estimate.totals.gstAmount} /></span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t-2 border-[#0F5C5B]/30 flex justify-between items-center text-xs font-black">
                    <span className="text-[#0F5C5B] text-[10px] uppercase">Total Amount:</span>
                    <span className="font-mono text-sm text-[#0F5C5B]">
                      <SBGCurrency value={estimate.totals.grandTotal} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Totals Summary and Balance Adjustment */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 pt-4 border-t border-[#DCE5E3]">
          {/* Left Column: Remarks and Balance Position Table */}
          <div className="flex-1 space-y-4 w-full">
            {/* Remarks */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-[#0F5C5B] uppercase tracking-wider block">Remarks & Notes</span>
              <p className="text-[#647777] bg-white p-3 rounded-xl border border-[#DCE5E3]">
                {estimate.remarks || 'Standard commercial estimate based on prevailing market gold rates and pure weights.'}
              </p>
            </div>

            {/* Customer Account Balance Adjustment Statement */}
            <div className="bg-white/95 rounded-2xl border-2 border-[#0F5C5B]/20 p-4 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#DCE5E3] pb-2.5 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#0F5C5B]/10 flex items-center justify-center">
                    <Scale className="w-3.5 h-3.5 text-[#0F5C5B]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#0F5C5B]">
                      Customer Balance Adjustment Statement
                    </h4>
                    <span className="text-[10px] text-[#647777]">
                      Account: <strong>{customer?.name || estimate.customerName}</strong> ({customer?.code || 'SBG-C101'})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Inline switcher */}
                  <div className="flex items-center rounded-lg bg-white border border-[#DCE5E3] p-0.5 text-[11px] shadow-2xs">
                    <button
                      onClick={() => handleToggleTransactionType('PURCHASE')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        isPurchase ? 'bg-[#0F5C5B] text-white shadow-xs' : 'text-[#647777] hover:text-[#0F5C5B]'
                      }`}
                    >
                      Purchase (−)
                    </button>
                    <button
                      onClick={() => handleToggleTransactionType('SALE')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        !isPurchase ? 'bg-[#D9B76C] text-[#173333] shadow-xs' : 'text-[#647777] hover:text-[#0F5C5B]'
                      }`}
                    >
                      Sale (+)
                    </button>
                  </div>

                  <SBGBadge variant={estimate.status === 'CONFIRMED' ? 'success' : 'warning'}>
                    {estimate.status === 'CONFIRMED' ? 'Applied to Ledger' : 'Draft / Unapplied'}
                  </SBGBadge>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DCE5E3] text-[10px] uppercase font-bold text-[#647777] bg-[#0F5C5B]/5">
                      <th className="py-2.5 px-3">Transaction / Balance Component</th>
                      <th className="py-2.5 px-3 text-right">Pure Gold (WT)</th>
                      <th className="py-2.5 px-3 text-right font-bold text-[#0F5C5B]">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5E3]/60 font-mono">
                    <tr>
                      <td className="py-2.5 px-3 font-sans text-[#4A5D5C] font-medium flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-[#647777]">1</span>
                        Previous Balance
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#173333]">
                        {prevWT.toFixed(3)} g
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#173333]">
                        <SBGCurrency value={prevMC} />
                      </td>
                    </tr>
                    <tr className={`${isPurchase ? 'bg-amber-500/10 text-amber-900' : 'bg-[#0F5C5B]/5 text-[#0F5C5B]'} font-semibold`}>
                      <td className="py-2.5 px-3 font-sans flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${isPurchase ? 'bg-amber-500/20 text-amber-800' : 'bg-[#0F5C5B]/20 text-[#0F5C5B]'}`}>
                          {isPurchase ? '−' : '+'}
                        </span>
                        <div>
                          <div className="font-bold">{isPurchase ? 'Purchase Adjustment (Receipt − Credit)' : 'Sale Adjustment (Issue + Debit)'}</div>
                          <div className="text-[10px] font-normal text-[#647777]">
                            {isPurchase
                              ? 'Pure Gold WT credited to Gold account; Remaining Cash (MC, Stones & GST) credited to Cash balance'
                              : 'Pure Gold WT debited to Gold account; Remaining Cash debited to Cash balance'}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        <div>{deltaPureWT >= 0 ? '+' : '−'} {Math.abs(deltaPureWT).toFixed(3)} g</div>
                        <div className="text-[10px] font-normal text-[#647777]">
                          (Pure Gold Metal)
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        <div>{deltaMC >= 0 ? '+' : '−'} <SBGCurrency value={Math.abs(deltaMC)} /></div>
                        <div className="text-[10px] font-normal text-[#647777]">
                          (Remaining Cash)
                        </div>
                      </td>
                    </tr>
                    <tr className="border-t-2 border-[#0F5C5B] bg-[#0F5C5B]/10 font-bold">
                      <td className="py-3 px-3 font-sans text-[#0F5C5B] flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#0F5C5B] text-white flex items-center justify-center text-[10px] font-bold">=</span>
                        New Closing Balance
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-[#0F5C5B]">
                        {newWT.toFixed(3)} g
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-[#0F5C5B]">
                        <SBGCurrency value={newMC} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status Note */}
              <div className="pt-2 border-t border-[#DCE5E3]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                {estimate.status === 'CONFIRMED' ? (
                  <>
                    <span className="text-[#1A825B] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1A825B]" />
                      Confirmed: Customer Ledger has been updated with these adjusted balances.
                    </span>
                    {customer && (
                      <button
                        onClick={() => onNavigate('customer-profile', customer.id)}
                        className="text-[#0F5C5B] font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        Open Ledger <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-[#8C6A23] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#C48C2B]" />
                    Draft Estimate. Click "Confirm & Post to Ledger" to apply this adjustment to {customer?.name || 'Customer'}'s Ledger.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Cost Sheet Totals & Balance Adjustment Box */}
          <div className="w-full lg:w-96 space-y-3 shrink-0">
            <div className="space-y-2.5 text-xs bg-white/70 p-4 rounded-xl border border-[#DCE5E3]">
              <div className="flex justify-between text-[#647777]">
                <span>Gold Metal Value:</span>
                <div className="text-right">
                  <SBGCurrency value={estimate.totals.goldValue} />
                  <span className="block text-[10px] text-[#0F5C5B] font-mono font-medium">
                    {(estimate.totals.goldPureWT ?? estimate.totals.totalPureWT).toFixed(3)}g Pure Gold
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-[#647777]">
                <span>Diamond & Gemstone Value:</span>
                <div className="text-right">
                  <SBGCurrency value={estimate.totals.diamondValue + estimate.totals.psValue} />
                  <div className="text-[10px] text-[#173333] font-mono space-y-0.5">
                    {(estimate.totals.diamondCarats ?? 0) > 0 && (
                      <div>Dmd: {(estimate.totals.diamondCarats ?? 0).toFixed(2)} ct</div>
                    )}
                    {(estimate.totals.psCarats ?? 0) > 0 && (
                      <div>
                        PS: {(estimate.totals.psCarats ?? 0).toFixed(2)} ct
                        {(estimate.totals.psPureWT ?? 0) > 0 && ` (${(estimate.totals.psPureWT ?? 0).toFixed(3)}g Pure)`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-[#647777]">
                <span>Making Charges (MC):</span>
                <SBGCurrency value={estimate.totals.mcValue} />
              </div>
              <div className="flex justify-between pt-2 border-t border-[#DCE5E3] font-semibold text-[#173333]">
                <span>Taxable Value:</span>
                <SBGCurrency value={estimate.totals.taxableValue} />
              </div>
              <div className="flex justify-between text-[#647777]">
                <span>GST ({estimate.totals.gstRate}%):</span>
                <SBGCurrency value={estimate.totals.gstAmount} />
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-[#0F5C5B] font-bold text-base text-[#0F5C5B]">
                <span>Grand Total:</span>
                <div className="text-right">
                  <SBGCurrency value={estimate.totals.grandTotal} />
                  <span className="block text-[10px] text-[#0F5C5B] font-mono font-semibold">
                    Pure WT: {estimate.totals.totalPureWT.toFixed(3)}g
                  </span>
                </div>
              </div>

              {/* Quick Balance Adjustment Breakdown */}
              <div className="pt-3 mt-2 border-t-2 border-dashed border-[#DCE5E3] space-y-2 text-xs">
                <span className="font-bold text-[10px] uppercase tracking-wider text-[#0F5C5B] block">
                  Account Balance Impact
                </span>

                {/* Pure Gold Balance */}
                <div className="bg-[#0F5C5B]/5 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#0F5C5B]">
                    <span>Pure Gold Balance</span>
                    <Scale className="w-3 h-3 text-[#0F5C5B]" />
                  </div>
                  <div className="flex justify-between text-[#647777] text-[11px]">
                    <span>Previous:</span>
                    <span className="font-mono">{prevWT.toFixed(3)} g</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className={isPurchase ? 'text-amber-800' : 'text-[#0F5C5B]'}>
                      ({isPurchase ? '−' : '+'}) {isPurchase ? 'Purchase Pure Gold:' : 'Sale Pure Gold:'}
                    </span>
                    <span className={`font-mono ${isPurchase ? 'text-amber-800' : 'text-[#0F5C5B]'}`}>
                      {deltaPureWT >= 0 ? '+' : '−'} {Math.abs(deltaPureWT).toFixed(3)} g
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#0F5C5B]/20 font-bold text-[#173333]">
                    <span>(=) New Gold Balance:</span>
                    <span className="font-mono text-[#0F5C5B]">{newWT.toFixed(3)} g</span>
                  </div>
                </div>

                {/* Amount Balance */}
                <div className="bg-[#D9B76C]/10 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#8C6A23]">
                    <span>Cash / MC Balance</span>
                    <Wallet className="w-3 h-3 text-[#8C6A23]" />
                  </div>
                  <div className="flex justify-between text-[#647777] text-[11px]">
                    <span>Previous:</span>
                    <span className="font-mono"><SBGCurrency value={prevMC} /></span>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className={isPurchase ? 'text-amber-800' : 'text-[#0F5C5B]'}>
                      ({isPurchase ? '−' : '+'}) {isPurchase ? 'Purchase Remaining Cash:' : 'Sale Remaining Cash:'}
                    </span>
                    <span className={`font-mono ${isPurchase ? 'text-amber-800' : 'text-[#0F5C5B]'}`}>
                      {deltaMC >= 0 ? '+' : '−'} <SBGCurrency value={Math.abs(deltaMC)} />
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#D9B76C]/30 font-bold text-[#173333]">
                    <span>(=) New Cash Balance:</span>
                    <span className="font-mono text-[#0F5C5B]"><SBGCurrency value={newMC} /></span>
                  </div>
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
