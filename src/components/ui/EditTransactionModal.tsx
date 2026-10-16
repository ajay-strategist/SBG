import React, { useState, useEffect } from 'react';
import { LedgerTransaction, TransactionDirection, ParticularsType } from '../../core/calculations';
import { useSBG } from '../../store/sbgStore';
import { SBGModal, SBGButton } from './index';
import {
  Calendar,
  FileText,
  Scale,
  Banknote,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Calculator,
  ExternalLink,
} from 'lucide-react';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: LedgerTransaction | null;
  customerName?: string;
  onSuccess?: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  customerName,
  onSuccess,
}) => {
  const { updateTransaction } = useSBG();

  const [date, setDate] = useState('');
  const [direction, setDirection] = useState<TransactionDirection>('ISSUE');
  const [particulars, setParticulars] = useState<ParticularsType>('ISSUE');
  const [description, setDescription] = useState('');
  const [erpRef, setErpRef] = useState('');
  const [nos, setNos] = useState<string>('');
  const [grossWTStr, setGrossWTStr] = useState('0');
  const [stoneWTStr, setStoneWTStr] = useState('0');
  const [touchStr, setTouchStr] = useState('76.0');
  const [stoneAmountStr, setStoneAmountStr] = useState('0');
  const [mcRateStr, setMcRateStr] = useState('0');
  const [mcAmountStr, setMcAmountStr] = useState('0');
  const [totalAmountStr, setTotalAmountStr] = useState('0');
  const [pureWTOverride, setPureWTOverride] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction && isOpen) {
      setDate(transaction.date || new Date().toISOString().split('T')[0]);
      setDirection(transaction.direction || 'ISSUE');
      setParticulars(transaction.particulars || 'ISSUE');
      setDescription(transaction.description || '');
      setErpRef(transaction.erpRef || '');
      setNos(transaction.nos ? transaction.nos.toString() : '');
      setGrossWTStr(Math.abs(transaction.grossWT || 0).toString());
      setStoneWTStr(Math.abs(transaction.stoneWT || 0).toString());
      setTouchStr((transaction.touch || 0).toString());
      setStoneAmountStr(Math.abs(transaction.stoneAmount || 0).toString());
      setMcRateStr((transaction.mcRate || 0).toString());
      setMcAmountStr(Math.abs(transaction.mcAmount || 0).toString());
      setTotalAmountStr(Math.abs(transaction.totalAmount || 0).toString());
      setPureWTOverride(null);
      setError(null);
    }
  }, [transaction, isOpen]);

  if (!transaction) return null;

  // Live Calculations
  const grossWT = parseFloat(grossWTStr) || 0;
  const stoneWT = parseFloat(stoneWTStr) || 0;
  const touch = parseFloat(touchStr) || 0;
  const netWTVal = Number((grossWT - stoneWT).toFixed(3));
  const autoPureWT = Number(((netWTVal * touch) / 100).toFixed(3));
  const effectivePureWT = pureWTOverride !== null ? (parseFloat(pureWTOverride) || 0) : autoPureWT;

  const stoneAmt = parseFloat(stoneAmountStr) || 0;
  const mcAmt = parseFloat(mcAmountStr) || 0;
  const autoTotalAmt = Number((stoneAmt + mcAmt).toFixed(2));

  const isReceipt = direction === 'RECEIPT';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError('Please select a transaction date.');
      return;
    }

    try {
      setIsSaving(true);

      const parsedTotalAmount = parseFloat(totalAmountStr);
      const finalTotalAmount = !isNaN(parsedTotalAmount) && parsedTotalAmount > 0
        ? parsedTotalAmount
        : autoTotalAmt;

      const signedNetWT = isReceipt ? -Math.abs(netWTVal) : Math.abs(netWTVal);
      const signedPureWT = isReceipt ? -Math.abs(effectivePureWT) : Math.abs(effectivePureWT);
      const signedGrossWT = isReceipt ? -Math.abs(grossWT) : Math.abs(grossWT);

      const signedStoneAmountCal = isReceipt ? -Math.abs(stoneAmt) : Math.abs(stoneAmt);
      const signedMcAmountCal = isReceipt ? -Math.abs(mcAmt) : Math.abs(mcAmt);
      const signedTotalAmount = isReceipt ? -Math.abs(finalTotalAmount) : Math.abs(finalTotalAmount);

      await updateTransaction(transaction.id, {
        date,
        direction,
        particulars,
        description: description.trim(),
        erpRef: erpRef.trim() || undefined,
        nos: nos ? parseInt(nos, 10) : 0,
        grossWT: signedGrossWT,
        stoneWT: Math.abs(stoneWT),
        netWT: signedNetWT,
        touch,
        pureWT: signedPureWT,
        stoneAmount: Math.abs(stoneAmt),
        stoneAmountCal: signedStoneAmountCal,
        mcRate: parseFloat(mcRateStr) || 0,
        mcAmount: Math.abs(mcAmt),
        mcAmountCal: signedMcAmountCal,
        totalAmount: signedTotalAmount,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update transaction entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SBGModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Transaction Entry — ${transaction.particulars}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
        {/* Banner with Customer / Transaction info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0F5C5B]/5 border border-[#0F5C5B]/15">
          <div>
            <div className="text-[11px] font-mono font-bold text-[#D9B76C] uppercase tracking-wider">
              Transaction ID: {transaction.id}
            </div>
            <div className="text-sm font-bold text-[#143B39]">
              {customerName ? `${customerName} • ` : ''}{transaction.description || transaction.particulars}
            </div>
          </div>
          {transaction.estimateId && (
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#0F5C5B] bg-white px-2.5 py-1 rounded-lg border border-[#DCE5E3]">
                <FileText className="w-3 h-3 text-[#C48C2B]" />
                Linked to Estimate
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-[#143B39] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0F5C5B]" />
              <span>Date</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5E3] font-mono text-sm text-[#143B39] bg-[#FAF9F6] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B] transition-all"
              required
            />
          </div>

          {/* Direction */}
          <div>
            <label className="block text-xs font-bold text-[#143B39] uppercase tracking-wider mb-1.5">
              Direction (Debit / Credit)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('ISSUE')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  direction === 'ISSUE'
                    ? 'bg-[#0F5C5B] text-white shadow-xs'
                    : 'bg-[#FAF9F6] border border-[#DCE5E3] text-[#647777] hover:text-[#173333]'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>ISSUE (+)</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection('RECEIPT')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  direction === 'RECEIPT'
                    ? 'bg-[#C24141] text-white shadow-xs'
                    : 'bg-[#FAF9F6] border border-[#DCE5E3] text-[#647777] hover:text-[#173333]'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>RECEIPT (−)</span>
              </button>
            </div>
          </div>

          {/* Particulars */}
          <div>
            <label className="block text-xs font-bold text-[#143B39] uppercase tracking-wider mb-1.5">
              Particulars
            </label>
            <select
              value={particulars}
              onChange={(e) => setParticulars(e.target.value as ParticularsType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5E3] text-sm font-semibold text-[#143B39] bg-[#FAF9F6] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B] transition-all"
            >
              <option value="PURCHASE">PURCHASE</option>
              <option value="SALE">SALE</option>
              <option value="RECEIPT">RECEIPT</option>
              <option value="ISSUE">ISSUE</option>
              <option value="PAYMENT_CASH">PAYMENT_CASH</option>
              <option value="PAYMENT_GOLD">PAYMENT_GOLD</option>
              <option value="PAYMENT RECEIVED">PAYMENT RECEIVED</option>
              <option value="PAYMENT PAID">PAYMENT PAID</option>
              <option value="SETTLEMENT">SETTLEMENT</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
              <option value="RETURN">RETURN</option>
            </select>
          </div>
        </div>

        {/* Row 2: Description & ERP Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#143B39] uppercase tracking-wider mb-1.5">
              Description / Job Reference
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 18K Cast Ring Job Order or RD/BB/031"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5E3] text-sm text-[#143B39] bg-[#FAF9F6] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B] transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#143B39] uppercase tracking-wider mb-1.5">
              ERP Ref / Voucher No
            </label>
            <input
              type="text"
              value={erpRef}
              onChange={(e) => setErpRef(e.target.value)}
              placeholder="e.g. EST-2026-372"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5E3] text-sm font-mono font-semibold text-[#143B39] bg-[#FAF9F6] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B] transition-all"
            />
          </div>
        </div>

        {/* Section: Metal Weights */}
        <div className="p-4 rounded-2xl bg-[#F8FBFB] border border-[#D5EAE5] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F5C5B] uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>Metal & Weight Parameters</span>
            </span>
            <span className="text-[11px] font-mono text-[#526B6A]">
              Net WT: <strong className="text-[#0F5C5B]">{netWTVal.toFixed(3)}g</strong> | Pure WT: <strong className="text-[#0F5C5B]">{effectivePureWT.toFixed(3)}g</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#526B6A] mb-1">Nos / Pieces</label>
              <input
                type="number"
                min="0"
                value={nos}
                onChange={(e) => setNos(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E3] font-mono text-xs text-[#143B39] bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#526B6A] mb-1">Gross WT (g)</label>
              <input
                type="number"
                step="0.001"
                value={grossWTStr}
                onChange={(e) => setGrossWTStr(e.target.value)}
                placeholder="0.000"
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E3] font-mono font-bold text-xs text-[#143B39] bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#526B6A] mb-1">Stone WT (g)</label>
              <input
                type="number"
                step="0.001"
                value={stoneWTStr}
                onChange={(e) => setStoneWTStr(e.target.value)}
                placeholder="0.000"
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E3] font-mono text-xs text-[#143B39] bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#526B6A] mb-1">Touch / Purity (%)</label>
              <input
                type="number"
                step="0.01"
                value={touchStr}
                onChange={(e) => setTouchStr(e.target.value)}
                placeholder="76.0"
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E3] font-mono font-bold text-xs text-[#143B39] bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section: Commercial Amounts */}
        <div className="p-4 rounded-2xl bg-[#FCFAF5] border border-[#EADBBD] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C6418] uppercase tracking-wider flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5" />
              <span>Commercial & Making Charge Values</span>
            </span>
            <span className="text-[11px] font-mono text-[#7A6D56]">
              Calculated Total: <strong className="text-[#8C6418]">₹{autoTotalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#7A6D56] mb-1">Stone Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={stoneAmountStr}
                onChange={(e) => setStoneAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E3] font-mono text-xs text-[#143B39] bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#7A6D56] mb-1">MC Rate (₹/g)</label>
              <input
                type="number"
                step="0.01"
                value={mcRateStr}
                onChange={(e) => setMcRateStr(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E3] font-mono text-xs text-[#143B39] bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#7A6D56] mb-1">MC Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={mcAmountStr}
                onChange={(e) => setMcAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E3] font-mono text-xs text-[#143B39] bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#7A6D56] mb-1">Final Total (₹)</label>
              <input
                type="number"
                step="0.01"
                value={totalAmountStr}
                onChange={(e) => setTotalAmountStr(e.target.value)}
                placeholder={autoTotalAmt.toString()}
                className="w-full px-3 py-2 rounded-xl border border-[#DCE5E3] font-mono font-bold text-xs text-[#143B39] bg-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#DCE5E3] flex justify-end gap-3">
          <SBGButton
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </SBGButton>
          <SBGButton
            variant="primary"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? 'Saving Changes...' : 'Save Entry Changes'}
          </SBGButton>
        </div>
      </form>
    </SBGModal>
  );
};
