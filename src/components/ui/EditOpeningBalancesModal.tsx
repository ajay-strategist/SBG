import React, { useState, useEffect } from 'react';
import { Customer } from '../../core/calculations';
import { useSBG } from '../../store/sbgStore';
import { SBGModal, SBGButton, SBGInput } from './index';
import { Scale, Banknote, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface EditOpeningBalancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess?: () => void;
}

export const EditOpeningBalancesModal: React.FC<EditOpeningBalancesModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { updateCustomer } = useSBG();

  const [openingWTStr, setOpeningWTStr] = useState('0');
  const [openingMCStr, setOpeningMCStr] = useState('0');
  const [openingLedgerMCStr, setOpeningLedgerMCStr] = useState('0');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer && isOpen) {
      setOpeningWTStr(customer.openingWT !== undefined ? customer.openingWT.toString() : '0');
      setOpeningMCStr(customer.openingMC !== undefined ? customer.openingMC.toString() : '0');
      setOpeningLedgerMCStr(
        customer.openingLedgerMC !== undefined
          ? customer.openingLedgerMC.toString()
          : (customer.openingMC !== undefined ? customer.openingMC.toString() : '0')
      );
      setError(null);
    }
  }, [customer, isOpen]);

  if (!customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const newOpeningWT = parseFloat(openingWTStr);
    const newOpeningMC = parseFloat(openingMCStr);
    const newOpeningLedgerMC = parseFloat(openingLedgerMCStr);

    if (isNaN(newOpeningWT)) {
      setError('Please enter a valid Opening Pure Gold Weight (can be 0 or positive/negative).');
      return;
    }
    if (isNaN(newOpeningMC)) {
      setError('Please enter a valid Opening Making Charge Balance.');
      return;
    }

    try {
      setIsSaving(true);
      await updateCustomer(customer.id, {
        openingWT: Number(newOpeningWT.toFixed(3)),
        openingMC: Number(newOpeningMC.toFixed(2)),
        openingLedgerMC: isNaN(newOpeningLedgerMC) ? 0 : Number(newOpeningLedgerMC.toFixed(2)),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update opening balances. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SBGModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Opening Balances — ${customer.name}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
        {/* Customer Badge Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0F5C5B]/5 border border-[#0F5C5B]/15">
          <div>
            <div className="text-[11px] font-mono font-bold text-[#D9B76C] uppercase tracking-wider">
              {customer.code}
            </div>
            <div className="text-sm font-bold text-[#143B39]">{customer.name}</div>
          </div>
          <div className="text-right text-[11px] text-[#526B6A]">
            <span className="block font-medium">Customer City</span>
            <span className="font-semibold text-[#143B39]">{customer.city || 'N/A'}</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Opening Pure Gold Weight (g) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#143B39] flex items-center gap-1.5 uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5 text-[#C48C2B]" />
                <span>Opening Pure Gold Weight (WT)</span>
              </label>
              <span className="text-[10px] text-[#526B6A] font-medium">grams (g)</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                value={openingWTStr}
                onChange={(e) => setOpeningWTStr(e.target.value)}
                placeholder="0.000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5E3] font-mono font-bold text-sm text-[#143B39] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B] transition-all bg-[#FAF9F6]"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7A8F8D]">
                g
              </span>
            </div>
            <p className="text-[11px] text-[#647777] mt-1">
              Positive (+) = Customer owes gold to SBG | Negative (−) = Advance gold deposit by client
            </p>
          </div>

          {/* Opening Making Charge / Currency Balance (₹) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#143B39] flex items-center gap-1.5 uppercase tracking-wider">
                <Banknote className="w-3.5 h-3.5 text-[#0F5C5B]" />
                <span>Opening Making Charge Balance (MC)</span>
              </label>
              <span className="text-[10px] text-[#526B6A] font-medium">INR (₹)</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={openingMCStr}
                onChange={(e) => setOpeningMCStr(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5E3] font-mono font-bold text-sm text-[#143B39] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B] transition-all bg-[#FAF9F6]"
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7A8F8D]">
                ₹
              </span>
            </div>
            <p className="text-[11px] text-[#647777] mt-1">
              Positive (+) = Customer owes MC to SBG | Negative (−) = Advance payment/credit
            </p>
          </div>

          {/* Opening Cash Ledger Balance (₹) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#143B39] flex items-center gap-1.5 uppercase tracking-wider">
                <Banknote className="w-3.5 h-3.5 text-[#55477B]" />
                <span>Opening Cash Ledger Balance</span>
              </label>
              <span className="text-[10px] text-[#526B6A] font-medium">Single-Entry Cash</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={openingLedgerMCStr}
                onChange={(e) => setOpeningLedgerMCStr(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE5E3] font-mono font-bold text-sm text-[#143B39] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B] transition-all bg-[#FAF9F6]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7A8F8D]">
                ₹
              </span>
            </div>
            <p className="text-[11px] text-[#647777] mt-1">
              Starting initial balance for the commercial cash ledger table.
            </p>
          </div>
        </div>

        {/* Dynamic Recalculation Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Automatic Ledger Recalculation</span>
          </div>
          Saving changes will immediately recompute all running balances for this customer&apos;s transactions and update the global totals with zero discrepancy.
        </div>

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
            {isSaving ? 'Updating...' : 'Save Opening Balances'}
          </SBGButton>
        </div>
      </form>
    </SBGModal>
  );
};
