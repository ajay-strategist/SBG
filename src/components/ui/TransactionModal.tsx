import React, { useState, useEffect } from 'react';
import { useSBG } from '../../store/sbgStore';
import {
  HandCoins,
  Coins,
  Banknote,
  Scale,
  Calendar,
  User,
  FileText,
  ChevronDown,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  Send,
  X,
  Landmark,
  IndianRupee,
  Sparkles,
} from 'lucide-react';

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
  onSuccess,
}) => {
  const { customers, addTransaction, goldMarketRate } = useSBG();

  // Customer selection
  const [customerId, setCustomerId] = useState(defaultCustomerId || customers[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherType, setVoucherType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');
  const [jobRef, setJobRef] = useState('');
  const [notes, setNotes] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [postToTally, setPostToTally] = useState(true);

  // Gold Settlement fields
  const [goldWeightStr, setGoldWeightStr] = useState('');
  const [touchStr, setTouchStr] = useState('99.5');
  const [goldRateStr, setGoldRateStr] = useState('');
  const [goldAmountOverride, setGoldAmountOverride] = useState<string | null>(null);

  // Cash Settlement fields
  const [cashAmountStr, setCashAmountStr] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync default customer and rate when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultCustomerId) {
        setCustomerId(defaultCustomerId);
      } else if (customers.length > 0 && !customerId) {
        setCustomerId(customers[0].id);
      }
      if (goldMarketRate && !goldRateStr) {
        setGoldRateStr(goldMarketRate.toString());
      }
      setGoldAmountOverride(null);
    }
  }, [isOpen, defaultCustomerId, customers, customerId, goldMarketRate]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Computations
  const goldWeight = parseFloat(goldWeightStr) || 0;
  const touch = parseFloat(touchStr) || 0;
  const goldRate = parseFloat(goldRateStr) || (goldMarketRate || 0);
  const pureWT = Number(((goldWeight * touch) / 100).toFixed(3));

  // Gold Amount: auto-calculated or manually overridden
  const autoGoldAmount = Number((pureWT * goldRate).toFixed(2));
  const effectiveGoldAmount = goldAmountOverride !== null
    ? (parseFloat(goldAmountOverride) || 0)
    : autoGoldAmount;

  const cashAmount = parseFloat(cashAmountStr) || 0;
  const totalCashEquivalent = Number((effectiveGoldAmount + cashAmount).toFixed(2));

  const isReceipt = voucherType === 'RECEIPT';
  const direction = isReceipt ? 'RECEIPT' : 'ISSUE';
  const particulars = isReceipt ? 'PAYMENT_RECEIVED' : 'PAYMENT_PAID';

  // Customer current balances
  const currentWT = selectedCustomer ? selectedCustomer.currentWT : 0;
  const currentMC = selectedCustomer ? selectedCustomer.currentMC : 0;

  // New balances after transaction
  // Receipt reduces customer liability (or increases advance), Payment increases liability (or reduces advance)
  const newWT = isReceipt ? (currentWT - pureWT) : (currentWT + pureWT);
  const newMC = isReceipt ? (currentMC - cashAmount) : (currentMC + cashAmount);

  const formatGold = (val: number) => {
    if (Math.abs(val) < 0.0001) return '0.000 g';
    if (val < 0) return `${val.toFixed(3)} g`;
    return `${val.toFixed(3)} g`;
  };

  const formatCash = (val: number) => {
    if (Math.abs(val) < 0.01) return '₹ 0.00';
    if (val < 0) return `- ₹ ${Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleGoldAmountChange = (val: string) => {
    setGoldAmountOverride(val);
  };

  const handleResetGoldAmount = () => {
    setGoldAmountOverride(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;

    if (goldWeight === 0 && cashAmount === 0 && effectiveGoldAmount === 0) {
      alert('Please enter either a Gold Weight or Cash Amount to record the payment.');
      return;
    }

    const signedPureWT = isReceipt ? -Math.abs(pureWT) : Math.abs(pureWT);
    const signedCash = isReceipt ? -Math.abs(cashAmount) : Math.abs(cashAmount);
    const signedTotalCashEquivalent = isReceipt ? -Math.abs(totalCashEquivalent) : Math.abs(totalCashEquivalent);

    const descriptionParts: string[] = [];
    if (goldWeight > 0) {
      descriptionParts.push(`${goldWeight.toFixed(3)}g Gold (${touch}% = ${pureWT.toFixed(3)}g Pure @ ₹${goldRate.toLocaleString('en-IN')}/g = ₹${effectiveGoldAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })})`);
    }
    if (cashAmount > 0) {
      descriptionParts.push(`Cash/Bank (${paymentMode}): ₹${cashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    }
    if (jobRef.trim()) {
      descriptionParts.push(`Ref: ${jobRef.trim()}`);
    }
    if (notes.trim()) {
      descriptionParts.push(`Notes: ${notes.trim()}`);
    }
    if (remarks.trim()) {
      descriptionParts.push(`Remarks: ${remarks.trim()}`);
    }
    if (postToTally) {
      descriptionParts.push('Posted to Financial Accounts');
    }

    const description = `${isReceipt ? 'Payment Received' : 'Payment Made'}: ${descriptionParts.join(' | ')}`;

    await addTransaction({
      customerId,
      date,
      direction,
      particulars,
      description,
      nos: 0,
      grossWT: goldWeight,
      stoneWT: 0,
      netWT: isReceipt ? -Math.abs(goldWeight) : Math.abs(goldWeight),
      touch,
      pureWT: signedPureWT,
      stoneAmount: 0,
      stoneAmountCal: 0,
      mcRate: 0,
      mcAmount: cashAmount,
      mcAmountCal: signedCash,
      goldRate,
      goldAmount: effectiveGoldAmount,
      cashAmount,
      totalAmount: signedTotalCashEquivalent,
      status: 'CONFIRMED',
      erpRef: jobRef.trim() || undefined,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      if (onSuccess) onSuccess(customerId);
    }, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#DCE5E3]/80 flex flex-col max-h-[96vh] overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E6F4F1] flex items-center justify-center text-[#0F766E] shadow-xs shrink-0">
              <HandCoins className="w-6 h-6 text-[#0F766E]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0D3B35] tracking-tight">
                Record Payment (Gold &amp; Cash)
              </h2>
              <p className="text-xs text-[#647777] font-medium mt-0.5">
                Record gold and/or cash received from the customer and post to accounts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-[#8A9E99] hover:text-[#173333] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {savedSuccess ? (
          <div className="py-16 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-serif font-bold text-[#0F5C5B]">Payment Confirmed &amp; Posted!</h3>
            <p className="text-xs text-[#647777] max-w-sm mx-auto">
              Customer&apos;s Gold &amp; Cash balances and commercial ledger have been synchronized in real-time.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="overflow-y-auto px-6 py-2.5 space-y-3.5 flex-1 touch-scroll">
              {/* Row 1: 3-column input grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Customer Account */}
                <div>
                  <label className="text-xs font-bold text-[#173333] mb-1.5 block">
                    Customer Account
                  </label>
                  <div className="relative flex items-center bg-white border border-[#DCE5E3] rounded-xl px-3 py-2.5 focus-within:border-[#0F5C5B] focus-within:ring-1 focus-within:ring-[#0F5C5B] transition-all">
                    <User className="w-4 h-4 text-[#7C8B87] shrink-0 mr-2.5" />
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      required
                      className="w-full bg-transparent text-xs font-bold text-[#173333] outline-none appearance-none cursor-pointer pr-6 truncate"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#7C8B87] absolute right-3 pointer-events-none" />
                  </div>
                </div>

                {/* Payment Date */}
                <div>
                  <label className="text-xs font-bold text-[#173333] mb-1.5 block">
                    Payment Date
                  </label>
                  <div className="relative flex items-center bg-white border border-[#DCE5E3] rounded-xl px-3 py-2.5 focus-within:border-[#0F5C5B] focus-within:ring-1 focus-within:ring-[#0F5C5B] transition-all">
                    <Calendar className="w-4 h-4 text-[#7C8B87] shrink-0 mr-2.5" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full bg-transparent text-xs font-bold text-[#173333] outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Reference / Job No. */}
                <div>
                  <label className="text-xs font-bold text-[#173333] mb-1.5 block">
                    Reference / Job No.
                  </label>
                  <div className="flex items-center bg-white border border-[#DCE5E3] rounded-xl px-3 py-2.5 focus-within:border-[#0F5C5B] focus-within:ring-1 focus-within:ring-[#0F5C5B] transition-all">
                    <FileText className="w-4 h-4 text-[#7C8B87] shrink-0 mr-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. JOB-402 / CHQ-8821"
                      value={jobRef}
                      onChange={(e) => setJobRef(e.target.value)}
                      className="w-full bg-transparent text-xs text-[#173333] placeholder:text-[#9FB1AC] outline-none font-normal"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Current Balance Bar */}
              <div className="p-3 rounded-2xl bg-[#F8FBFA] border border-[#E1ECE9] flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] flex items-center justify-center text-[#0F766E]">
                    <Scale className="w-5 h-5 text-[#0F766E]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0F5C5B] block">Current Balance</span>
                    <span className="text-[11px] font-medium text-[#647777] block">
                      {selectedCustomer?.name || 'Customer'} ({selectedCustomer?.code || 'SBG'})
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
                  {/* Pure Gold Balance Card */}
                  <div className="flex-1 w-full bg-[#FFF9F2] border border-[#FDE5CC] rounded-xl px-3.5 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#FEEFD9] flex items-center justify-center text-[#D97706] shrink-0">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-[#7C8B87] block">Pure Gold Balance</span>
                        <span className="text-xs font-mono font-bold text-[#173333]">
                          {formatGold(currentWT)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        currentWT < 0
                          ? 'bg-[#FEEDDC] text-[#B85D19]'
                          : currentWT > 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {currentWT < 0 ? 'Advance' : currentWT > 0 ? 'Due' : 'Settled'}
                    </span>
                  </div>

                  {/* Cash (MC) Balance Card */}
                  <div className="flex-1 w-full bg-[#F0FAF7] border border-[#D0ECE3] rounded-xl px-3.5 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#DCF3EB] flex items-center justify-center text-[#0F766E] shrink-0">
                        <IndianRupee className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-[#7C8B87] block">Cash (MC) Balance</span>
                        <span className="text-xs font-mono font-bold text-[#173333]">
                          {formatCash(currentMC)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        currentMC < 0
                          ? 'bg-[#FEEDDC] text-[#B85D19]'
                          : currentMC > 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {currentMC < 0 ? 'Advance' : currentMC > 0 ? 'Due' : 'Settled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Transaction Direction */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#173333] block">
                  Transaction Direction
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Receipt Card */}
                  <button
                    type="button"
                    onClick={() => setVoucherType('RECEIPT')}
                    className={`p-3.5 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-all ${
                      isReceipt
                        ? 'border-2 border-[#0F766E] bg-[#F2FAF7] shadow-xs'
                        : 'border border-[#DCE5E3] bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isReceipt ? 'bg-[#E2F3EE] text-[#0F766E]' : 'bg-gray-100 text-[#7C8B87]'
                        }`}
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <span
                          className={`text-xs sm:text-sm font-bold block ${
                            isReceipt ? 'text-[#0F5C5B]' : 'text-[#173333]'
                          }`}
                        >
                          Receipt (Received from Customer)
                        </span>
                        <span className="text-[11px] text-[#647777] block">
                          Reduces customer balance (−)
                        </span>
                      </div>
                    </div>
                    {isReceipt ? (
                      <CheckCircle2 className="w-5 h-5 text-[#0F766E] fill-[#0F766E] text-white shrink-0 ml-2" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0 ml-2" />
                    )}
                  </button>

                  {/* Payment Card */}
                  <button
                    type="button"
                    onClick={() => setVoucherType('PAYMENT')}
                    className={`p-3.5 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-all ${
                      !isReceipt
                        ? 'border-2 border-[#D97706] bg-[#FFFBF0] shadow-xs'
                        : 'border border-[#DCE5E3] bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          !isReceipt ? 'bg-[#FEF0DB] text-[#D97706]' : 'bg-gray-100 text-[#7C8B87]'
                        }`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <span
                          className={`text-xs sm:text-sm font-bold block ${
                            !isReceipt ? 'text-[#8C5815]' : 'text-[#173333]'
                          }`}
                        >
                          Payment (Paid to Customer)
                        </span>
                        <span className="text-[11px] text-[#647777] block">
                          Increases customer balance (+)
                        </span>
                      </div>
                    </div>
                    {!isReceipt ? (
                      <CheckCircle2 className="w-5 h-5 text-[#D97706] fill-[#D97706] text-white shrink-0 ml-2" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0 ml-2" />
                    )}
                  </button>
                </div>
              </div>

              {/* Row 4: Side-by-Side Settlement Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Card: Gold Settlement */}
                <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#FBEAD2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-[#D97706]" />
                      <span className="font-serif font-bold text-[#173333] text-sm">
                        Gold Settlement
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#9A6208] bg-[#FEF2DC] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      Metal Entry
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-[#173333] mb-1 block">
                        Gold Weight (g)
                      </label>
                      <div className="flex items-center bg-white border border-[#DCE5E3] rounded-xl overflow-hidden focus-within:border-[#0F5C5B] focus-within:ring-1 focus-within:ring-[#0F5C5B]">
                        <input
                          type="number"
                          step="0.001"
                          placeholder="0.000"
                          value={goldWeightStr}
                          onChange={(e) => setGoldWeightStr(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 text-xs font-mono font-bold text-[#173333] outline-none"
                        />
                        <span className="px-3 py-2 text-xs font-medium text-[#7C8B87] bg-[#FAFCFC] border-l border-[#DCE5E3] select-none">
                          g
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#173333] mb-1 block">
                        Purity (%)
                      </label>
                      <div className="flex items-center bg-white border border-[#DCE5E3] rounded-xl overflow-hidden focus-within:border-[#0F5C5B] focus-within:ring-1 focus-within:ring-[#0F5C5B]">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="99.5"
                          value={touchStr}
                          onChange={(e) => setTouchStr(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 text-xs font-mono font-bold text-[#173333] outline-none"
                        />
                        <span className="px-3 py-2 text-xs font-medium text-[#7C8B87] bg-[#FAFCFC] border-l border-[#DCE5E3] select-none">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Calculated Pure Gold Inset */}
                  <div className="p-2.5 rounded-xl bg-white/90 border border-[#F5E6CD] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#647777]">
                      Calculated Pure Gold
                    </span>
                    <span className="text-sm font-mono font-bold text-[#0F5C5B]">
                      {pureWT.toFixed(3)} g
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-[#173333] mb-1 block">
                        Pure Gold Rate (₹/g)
                      </label>
                      <div className="flex items-center bg-white border border-[#DCE5E3] rounded-xl overflow-hidden focus-within:border-[#0F5C5B] focus-within:ring-1 focus-within:ring-[#0F5C5B]">
                        <input
                          type="number"
                          step="0.01"
                          placeholder={goldMarketRate?.toString() || '0.00'}
                          value={goldRateStr}
                          onChange={(e) => setGoldRateStr(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 text-xs font-mono font-bold text-[#173333] outline-none"
                        />
                        <span className="px-3 py-2 text-xs font-medium text-[#7C8B87] bg-[#FAFCFC] border-l border-[#DCE5E3] select-none">
                          /g
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-[#173333]">
                          Gold Amount (₹)
                        </label>
                        {goldAmountOverride !== null && (
                          <button
                            type="button"
                            onClick={handleResetGoldAmount}
                            className="text-[9px] font-bold text-[#0F5C5B] hover:underline cursor-pointer"
                          >
                            Auto
                          </button>
                        )}
                      </div>
                      <div className="flex items-center bg-white border border-[#DCE5E3] rounded-xl overflow-hidden focus-within:border-[#0F5C5B] focus-within:ring-1 focus-within:ring-[#0F5C5B]">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={
                            goldAmountOverride !== null
                              ? goldAmountOverride
                              : effectiveGoldAmount
                              ? effectiveGoldAmount.toFixed(2)
                              : ''
                          }
                          onChange={(e) => handleGoldAmountChange(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 text-xs font-mono font-bold text-[#173333] outline-none"
                        />
                        <span className="px-3 py-2 text-xs font-medium text-[#7C8B87] bg-[#FAFCFC] border-l border-[#DCE5E3] select-none">
                          ₹
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Cash / Bank Settlement */}
                <div className="p-4 rounded-2xl bg-[#F7FCFA] border border-[#CFECE2] space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#0F766E]" />
                      <span className="font-serif font-bold text-[#173333] text-sm">
                        Cash / Bank Settlement
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#0D6559] bg-[#DBF3EB] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      Currency Entry
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-[#173333] mb-1 block">
                        Cash / Bank Amount (₹)
                      </label>
                      <div className="flex items-center bg-white border border-[#DCE5E3] rounded-xl overflow-hidden focus-within:border-[#0F5C5B] focus-within:ring-1 focus-within:ring-[#0F5C5B]">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={cashAmountStr}
                          onChange={(e) => setCashAmountStr(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 text-xs font-mono font-bold text-[#173333] outline-none"
                        />
                        <span className="px-3 py-2 text-xs font-medium text-[#7C8B87] bg-[#FAFCFC] border-l border-[#DCE5E3] select-none">
                          ₹
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#173333] mb-1 block">
                        Payment Mode
                      </label>
                      <div className="relative flex items-center bg-white border border-[#DCE5E3] rounded-xl overflow-hidden focus-within:border-[#0F5C5B] focus-within:ring-1 focus-within:ring-[#0F5C5B]">
                        <Landmark className="w-4 h-4 text-[#7C8B87] ml-3 shrink-0" />
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                          className="w-full pl-2 pr-7 py-2 text-xs font-semibold text-[#173333] bg-transparent outline-none appearance-none cursor-pointer"
                        >
                          <option value="Cash">Cash</option>
                          <option value="NEFT / RTGS">NEFT / RTGS</option>
                          <option value="Cheque">Cheque</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Card</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#7C8B87] absolute right-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Payment Notes / Transaction ID */}
                  <div>
                    <label className="text-[11px] font-bold text-[#173333] mb-1 block">
                      Payment Notes / Transaction ID
                    </label>
                    <div className="flex items-center bg-white border border-[#DCE5E3] rounded-xl overflow-hidden px-3 py-2 focus-within:border-[#0F5C5B] focus-within:ring-1 focus-within:ring-[#0F5C5B]">
                      <FileText className="w-4 h-4 text-[#7C8B87] shrink-0 mr-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. UTR / IMPS Ref / Bank Name / Cheque No."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full text-xs text-[#173333] placeholder:text-[#9FB1AC] outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Direct Cash Component Inset */}
                  <div className="p-2.5 rounded-xl bg-white/90 border border-[#CFECE2] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#173333] block">
                        Direct Cash Component
                      </span>
                      <span className="text-[10px] text-[#7C8B87] block">
                        After adjusting any linked amounts
                      </span>
                    </div>
                    <span className="text-sm font-mono font-bold text-[#0F5C5B]">
                      ₹ {cashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 5: Live Account Impact Preview */}
              <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-[#D7EAE4] space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E2F3EE] flex items-center justify-center text-[#0F766E] shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-bold text-[#0F5C5B]">
                      Live Account Impact Preview
                    </h4>
                    <p className="text-xs text-[#647777]">
                      This payment will update the customer&apos;s Gold &amp; Cash balance as shown below.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gold Balance Impact */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#DCE5E3] space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#E8F4F8] flex items-center justify-center text-[#0284C7] shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[#0F5C5B]">Gold Balance Impact</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#647777]">Current Pure Gold Balance</span>
                        <span className="font-mono font-bold text-[#173333]">{formatGold(currentWT)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#647777]">Payment (This Entry)</span>
                        <span className="font-mono font-bold text-[#0F766E]">
                          {pureWT > 0 ? `${isReceipt ? '−' : '+'}${pureWT.toFixed(3)} g` : '0.000 g'}
                        </span>
                      </div>
                      <div className="border-t border-[#EEF3F2] pt-1 flex items-center justify-between">
                        <span className="font-bold text-[#0F5C5B]">New Pure Gold Balance</span>
                        <span className="font-mono font-bold text-sm text-[#0F5C5B]">{formatGold(newWT)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cash (MC) Balance Impact */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#DCE5E3] space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#DCF3EB] flex items-center justify-center text-[#0F766E] shrink-0">
                        <IndianRupee className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[#0F5C5B]">Cash (MC) Balance Impact</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#647777]">Current Cash Balance</span>
                        <span className="font-mono font-bold text-[#173333]">{formatCash(currentMC)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#647777]">Payment (This Entry)</span>
                        <span className="font-mono font-bold text-[#0F766E]">
                          {cashAmount > 0
                            ? `${isReceipt ? '−' : '+'}₹${cashAmount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : '₹ 0.00'}
                        </span>
                      </div>
                      <div className="border-t border-[#EEF3F2] pt-1 flex items-center justify-between">
                        <span className="font-bold text-[#0F5C5B]">New Cash Balance</span>
                        <span className="font-mono font-bold text-sm text-[#0F5C5B]">{formatCash(newMC)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 6: Additional Remarks (Optional) */}
              <div className="p-3 rounded-2xl bg-[#F8FBFA] border border-[#E1ECE9] space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#173333]">
                  <FileText className="w-3.5 h-3.5 text-[#7C8B87]" />
                  <span>Additional Remarks (Optional)</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Payment received against Invoice / Job Work / Settlement details..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-white border border-[#DCE5E3] rounded-xl px-3.5 py-2 text-xs text-[#173333] placeholder:text-[#9FB1AC] outline-none focus:border-[#0F5C5B] transition-all"
                />
              </div>
            </div>

            {/* Row 7: Modal Footer */}
            <div className="px-6 py-3.5 bg-[#FAFDFD] border-t border-[#E1ECE9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="post-to-tally"
                  checked={postToTally}
                  onChange={(e) => setPostToTally(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[#0F5C5B] accent-[#0F5C5B] cursor-pointer"
                />
                <div>
                  <label htmlFor="post-to-tally" className="text-xs font-bold text-[#173333] cursor-pointer block">
                    Post to Tally / Financial Accounts
                  </label>
                  <p className="text-[11px] text-[#7C8B87]">
                    This will create corresponding accounting entry.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-[#DCE5E3] text-[#173333] font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0F5C5B] hover:bg-[#0D4E4D] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Post Payment &amp; Update Accounts</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
