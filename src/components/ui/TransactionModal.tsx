import React, { useState, useEffect } from 'react';
import { useSBG } from '../../store/sbgStore';
import { SBGModal, SBGInput, SBGSelect, SBGButton } from './index';
import {
  calculateNetWT,
  calculatePureWT,
  calculateTotalAmount,
  stoneCaratsToGrams,
} from '../../core/calculations';
import { ShoppingBag, Coins, Calculator, CheckCircle2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
  initialMode?: 'COST_SHEET' | 'RECEIPT_PAYMENT';
  onSuccess?: (customerId: string) => void;
  onNavigate?: (tab: any, entityId?: string) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  defaultCustomerId,
  initialMode = 'RECEIPT_PAYMENT',
  onSuccess,
  onNavigate,
}) => {
  const { customers, addTransaction } = useSBG();

  // Mode: 'COST_SHEET' (Purchase/Sale) vs 'RECEIPT_PAYMENT' (Gold/Cash Receipt/Payment)
  const [mode, setMode] = useState<'COST_SHEET' | 'RECEIPT_PAYMENT'>(initialMode);

  // Common Fields
  const [customerId, setCustomerId] = useState(defaultCustomerId || customers[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // --- Mode 1: Cost Sheet (Purchase / Sale) Fields ---
  const [costSheetType, setCostSheetType] = useState<'SALE' | 'PURCHASE'>('SALE');
  const [nos, setNos] = useState<number>(1);
  const [grossWT, setGrossWT] = useState<number>(0);
  const [stoneWT, setStoneWT] = useState<number>(0);
  const [stoneWTCarats, setStoneWTCarats] = useState<number>(0);
  const [touch, setTouch] = useState<number>(91.6);
  const [mcRate, setMcRate] = useState<number>(0);
  const [mcAmount, setMcAmount] = useState<number>(0);
  const [stoneAmount, setStoneAmount] = useState<number>(0);

  // --- Mode 2: Receipt / Payment (Gold & Cash) Fields ---
  const [voucherType, setVoucherType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');
  const [goldGrams, setGoldGrams] = useState<number>(0);
  const [goldTouch, setGoldTouch] = useState<number>(99.5);
  const [cashAmount, setCashAmount] = useState<number>(0);

  useEffect(() => {
    if (defaultCustomerId) {
      setCustomerId(defaultCustomerId);
    } else if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [defaultCustomerId, customers]);

  // Handle Carats to Grams conversion in Cost Sheet mode
  const handleCaratChange = (carats: number) => {
    setStoneWTCarats(carats);
    setStoneWT(stoneCaratsToGrams(carats));
  };

  // Recalculate MC Amount when grossWT or mcRate changes in Cost Sheet mode
  const handleMcRateChange = (rate: number) => {
    setMcRate(rate);
    if (grossWT > 0 && rate > 0) {
      setMcAmount(Number((grossWT * rate).toFixed(2)));
    }
  };

  const handleGrossWTChange = (wt: number) => {
    setGrossWT(wt);
    if (wt > 0 && mcRate > 0) {
      setMcAmount(Number((wt * mcRate).toFixed(2)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;

    if (mode === 'COST_SHEET') {
      const direction = costSheetType === 'SALE' ? 'ISSUE' : 'RECEIPT';
      const particulars = costSheetType === 'SALE' ? 'SALE' : 'PURCHASE';

      const netWT = calculateNetWT(grossWT, stoneWT, direction);
      const pureWT = calculatePureWT(netWT, touch);

      const mcAmountCal = direction === 'RECEIPT' ? -Math.abs(mcAmount) : Math.abs(mcAmount);
      const stoneAmountCal = direction === 'RECEIPT' ? -Math.abs(stoneAmount) : Math.abs(stoneAmount);
      const totalAmount = calculateTotalAmount(stoneAmountCal, mcAmountCal);

      addTransaction({
        customerId,
        date,
        direction,
        particulars,
        description: description || `${costSheetType} - ${nos} Pcs Ornaments (${grossWT}g, ${touch}%)`,
        nos,
        grossWT,
        stoneWT,
        stoneWTCarat: stoneWTCarats,
        netWT,
        touch,
        pureWT,
        stoneAmount,
        stoneAmountCal,
        mcRate,
        mcAmount,
        mcAmountCal,
        totalAmount,
        status: 'CONFIRMED',
      });
    } else {
      // Voucher Mode (Receipt / Payment)
      const isReceipt = voucherType === 'RECEIPT';
      const direction = isReceipt ? 'RECEIPT' : 'ISSUE';
      const particulars = isReceipt ? 'PAYMENT_RECEIVED' : 'PAYMENT_PAID';

      // Pure Gold Weight calculation for received/paid metal
      const rawPureGold = (goldGrams * (goldTouch / 100));
      const pureWT = isReceipt ? -Math.abs(rawPureGold) : Math.abs(rawPureGold);

      // Amount calculation for cash received/paid
      const totalAmount = isReceipt ? -Math.abs(cashAmount) : Math.abs(cashAmount);

      addTransaction({
        customerId,
        date,
        direction,
        particulars,
        description:
          description ||
          `${voucherType === 'RECEIPT' ? 'Received from Customer' : 'Paid to Customer'}: ${
            goldGrams > 0 ? `${goldGrams}g Gold (${goldTouch}%)` : ''
          } ${cashAmount > 0 ? `₹${cashAmount.toLocaleString('en-IN')}` : ''}`.trim(),
        nos: 0,
        grossWT: goldGrams,
        stoneWT: 0,
        netWT: isReceipt ? -Math.abs(goldGrams) : Math.abs(goldGrams),
        touch: goldTouch,
        pureWT: Number(pureWT.toFixed(3)),
        stoneAmount: 0,
        stoneAmountCal: 0,
        mcRate: 0,
        mcAmount: cashAmount,
        mcAmountCal: totalAmount,
        totalAmount: Number(totalAmount.toFixed(2)),
        status: 'CONFIRMED',
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      if (onSuccess) onSuccess(customerId);
    }, 600);
  };

  const selectedCust = customers.find((c) => c.id === customerId);

  return (
    <SBGModal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Customer Transaction"
    >
      {savedSuccess ? (
        <div className="py-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
          <h3 className="text-base font-bold text-[#0F5C5B]">Transaction Recorded Successfully!</h3>
          <p className="text-xs text-[#647777]">Customer ledger balance has been updated in real-time.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F2FAF8] rounded-xl border border-[#DCE5E3]">
            <button
              type="button"
              onClick={() => setMode('COST_SHEET')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'COST_SHEET'
                  ? 'bg-[#0F5C5B] text-white shadow-xs'
                  : 'text-[#647777] hover:text-[#173333]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> 1. Purchase / Sale (Cost Sheet)
            </button>

            <button
              type="button"
              onClick={() => setMode('RECEIPT_PAYMENT')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'RECEIPT_PAYMENT'
                  ? 'bg-[#0F5C5B] text-white shadow-xs'
                  : 'text-[#647777] hover:text-[#173333]'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-[#D9B76C]" /> 2. Receipt / Payment (Gold & Cash)
            </button>
          </div>

          {/* Customer Selection & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <SBGInput
              label="Transaction Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Selected Customer Current Balance Pill */}
          {selectedCust && (
            <div className="p-2.5 rounded-xl bg-white border border-[#DCE5E3] flex items-center justify-between text-xs">
              <span className="text-[#647777] font-medium">Current Balance:</span>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold ${selectedCust.currentWT >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {selectedCust.currentWT >= 0 ? `+${selectedCust.currentWT.toFixed(3)}g Due` : `${selectedCust.currentWT.toFixed(3)}g Adv`}
                </span>
                <span className={`font-mono font-bold ${selectedCust.currentMC >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  ₹ {selectedCust.currentMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* MODE 1: COST SHEET (PURCHASE / SALE) */}
          {mode === 'COST_SHEET' && (
            <div className="space-y-3.5 pt-2 border-t border-[#DCE5E3]">
              {/* Type Select: Sale (Issue) vs Purchase (Receipt) */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-[#173333] uppercase">Transaction Type:</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCostSheetType('SALE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border flex items-center gap-1.5 transition-all ${
                        costSheetType === 'SALE'
                          ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs font-extrabold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      💎 SALE (Issue / Delivery)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCostSheetType('PURCHASE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border flex items-center gap-1.5 transition-all ${
                        costSheetType === 'PURCHASE'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs font-extrabold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      📦 PURCHASE (Receipt / Inward)
                    </button>
                  </div>
                </div>

                {/* Direct Go to Estimate Sheet Banner */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#D9B76C]/15 to-[#0F5C5B]/10 border border-[#D9B76C]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0F5C5B]">
                      <span>{costSheetType === 'SALE' ? '💎' : '📦'}</span>
                      <span>{costSheetType === 'SALE' ? 'Sale' : 'Purchase'} handled in SBG Estimate Sheet</span>
                    </div>
                    <p className="text-[11px] text-[#647777] mt-0.5">
                      Sub-items, stone weight/carats, purity touch %, making charges, and taxes are calculated in Estimate.
                    </p>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate('new-estimate', customerId ? `${customerId}::${costSheetType}` : costSheetType);
                      }}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-[#0F5C5B] hover:bg-[#0A4847] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <span>Proceed to {costSheetType === 'SALE' ? 'Sale' : 'Purchase'} Estimate</span>
                      <span>➔</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 text-[10px] font-bold uppercase tracking-wider text-[#647777] border-t border-[#DCE5E3]/60">
                Or Quick Single-Line Entry
              </div>

              <SBGInput
                label="Item Description / Particulars"
                placeholder="e.g. 22K Gold Bangles / Casting Items"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SBGInput
                  label="Nos (Pcs)"
                  type="number"
                  min="1"
                  value={nos}
                  onChange={(e) => setNos(parseInt(e.target.value) || 0)}
                />

                <SBGInput
                  label="Gross Wt (g)"
                  type="number"
                  step="0.001"
                  value={grossWT || ''}
                  onChange={(e) => handleGrossWTChange(parseFloat(e.target.value) || 0)}
                  required
                />

                <SBGInput
                  label="Stone Wt (g)"
                  type="number"
                  step="0.001"
                  value={stoneWT || ''}
                  onChange={(e) => setStoneWT(parseFloat(e.target.value) || 0)}
                />

                <SBGInput
                  label="Touch (%)"
                  type="number"
                  step="0.1"
                  value={touch || ''}
                  onChange={(e) => setTouch(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <SBGInput
                  label="Stone Wt (Carats)"
                  type="number"
                  step="0.01"
                  value={stoneWTCarats || ''}
                  onChange={(e) => handleCaratChange(parseFloat(e.target.value) || 0)}
                />

                <SBGInput
                  label="MC Rate (₹/g)"
                  type="number"
                  step="0.01"
                  value={mcRate || ''}
                  onChange={(e) => handleMcRateChange(parseFloat(e.target.value) || 0)}
                />

                <SBGInput
                  label="Making Charge (₹)"
                  type="number"
                  step="0.01"
                  value={mcAmount || ''}
                  onChange={(e) => setMcAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Dynamic Calculation Live Summary */}
              <div className="p-3 bg-[#0F5C5B]/5 rounded-xl border border-[#0F5C5B]/20 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#647777] block uppercase font-bold">Calculated Pure Gold WT</span>
                  <span className="text-sm font-mono font-bold text-[#0F5C5B]">
                    {((grossWT - stoneWT) * (touch / 100)).toFixed(3)} g
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#647777] block uppercase font-bold">Calculated Total Amount</span>
                  <span className="text-sm font-mono font-bold text-[#0F5C5B]">
                    ₹ {mcAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: RECEIPT / PAYMENT (GOLD & CASH) */}
          {mode === 'RECEIPT_PAYMENT' && (
            <div className="space-y-3.5 pt-2 border-t border-[#DCE5E3]">
              {/* Voucher Direction Select */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-xs font-bold text-[#173333] uppercase tracking-wide">
                  Payment Direction:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVoucherType('RECEIPT')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                      voucherType === 'RECEIPT'
                        ? 'bg-[#E6F8F2] border-[#22A078] text-[#145C45] shadow-2xs font-extrabold ring-1 ring-[#22A078]/30'
                        : 'bg-white border-[#DCE5E3] text-[#647777] hover:bg-gray-50'
                    }`}
                  >
                    RECEIPT (Received from Customer −)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoucherType('PAYMENT')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                      voucherType === 'PAYMENT'
                        ? 'bg-[#FFF4E5] border-[#E5A84D] text-[#8C5815] shadow-2xs font-extrabold ring-1 ring-[#E5A84D]/30'
                        : 'bg-white border-[#DCE5E3] text-[#647777] hover:bg-gray-50'
                    }`}
                  >
                    PAYMENT (Paid to Customer +)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#0F5C5B] flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#D9B76C]" /> Gold Payment (grams)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <SBGInput
                      label="Gold Weight (g)"
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={goldGrams || ''}
                      onChange={(e) => setGoldGrams(parseFloat(e.target.value) || 0)}
                    />
                    <SBGInput
                      label="Touch / Purity (%)"
                      type="number"
                      step="0.1"
                      placeholder="99.5"
                      value={goldTouch || ''}
                      onChange={(e) => setGoldTouch(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#0F5C5B] flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-[#0F5C5B]" /> Cash Payment (₹)
                  </span>
                  <SBGInput
                    label="Cash / Bank Amount (₹)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashAmount || ''}
                    onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <SBGInput
                label="Transaction Notes / Reference"
                placeholder="e.g. Received via Bank Transfer / Physical Fine Gold bar"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Dynamic Calculation Summary matching screenshot */}
              <div className="p-3.5 bg-[#EBF6F4] rounded-xl border border-[#BDE3DB] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#4B6B68] block uppercase font-bold tracking-wider">
                    PURE GOLD EFFECT
                  </span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      voucherType === 'RECEIPT' ? 'text-[#145C45]' : 'text-[#8C5815]'
                    }`}
                  >
                    {voucherType === 'RECEIPT' ? '-' : '+'}{(goldGrams * (goldTouch / 100)).toFixed(3)} g
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#4B6B68] block uppercase font-bold tracking-wider">
                    CASH AMOUNT EFFECT
                  </span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      voucherType === 'RECEIPT' ? 'text-[#145C45]' : 'text-[#B83232]'
                    }`}
                  >
                    {voucherType === 'RECEIPT' ? '-' : '+'}₹ {cashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5E3]">
            <SBGButton variant="outline" type="button" onClick={onClose}>
              Cancel
            </SBGButton>
            <SBGButton variant="primary" type="submit">
              Post Transaction to Ledger
            </SBGButton>
          </div>
        </form>
      )}
    </SBGModal>
  );
};
