import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  SBGCard,
  SBGButton,
  SBGInput,
  SBGSelect,
  SBGBadge,
  SBGCurrency,
  SBGWeight,
  SBGBalanceCard,
} from '../components/ui';
import { calculateSettlement } from '../core/calculations';
import {
  Coins,
  ArrowLeft,
  Scale,
  Wallet,
  Save,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface NewSettlementViewProps {
  preselectedCustomerId?: string;
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const NewSettlementView: React.FC<NewSettlementViewProps> = ({
  preselectedCustomerId,
  onNavigate,
}) => {
  const { customers, orders, goldMarketRate, addSettlement } = useSBG();

  const [customerId, setCustomerId] = useState(preselectedCustomerId || customers[0]?.id || '');
  const [orderId, setOrderId] = useState('');
  const [settlementType, setSettlementType] = useState<'GOLD_ONLY' | 'CASH_ONLY' | 'GOLD_AND_CASH'>('GOLD_AND_CASH');
  const [goldReceived, setGoldReceived] = useState<number>(10.0);
  const [cashReceived, setCashReceived] = useState<number>(20000);
  const [agreedGoldRate, setAgreedGoldRate] = useState<number>(goldMarketRate);
  const [notes, setNotes] = useState('Payment settlement via Fine Gold bar 99.5 and RTGS transfer');

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerOrders = orders.filter((o) => o.customerId === customerId);

  // Real-time Settlement calculation preview
  const prevWT = selectedCustomer?.currentWT || 0;
  const prevMC = selectedCustomer?.currentMC || 0;

  const result = calculateSettlement({
    customerId,
    orderId: orderId || undefined,
    settlementType,
    previousBalanceWT: prevWT,
    previousBalanceMC: prevMC,
    goldReceived: settlementType === 'CASH_ONLY' ? 0 : goldReceived,
    cashReceived: settlementType === 'GOLD_ONLY' ? 0 : cashReceived,
    agreedGoldRate,
    notes,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;

    addSettlement({
      customerId,
      orderId: orderId || undefined,
      settlementType,
      goldReceived: settlementType === 'CASH_ONLY' ? 0 : goldReceived,
      cashReceived: settlementType === 'GOLD_ONLY' ? 0 : cashReceived,
      agreedGoldRate,
      notes,
    });

    onNavigate('customer-profile', customerId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('settlements')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0F5C5B] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Settlements
        </button>

        <span className="text-xs text-[#647777]">
          Independent Agreed Gold Rate settlement calculation
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prominently Display Current Balances */}
          {selectedCustomer && (
            <div className="glass-panel-gold p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-black/5 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A23]">
                  CURRENT COMMERCIAL POSITION: {selectedCustomer.name}
                </span>
                <span className="text-[11px] font-mono text-[#8C6A23] font-bold">{selectedCustomer.code}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/80 p-3.5 rounded-xl border border-white/90 flex items-center gap-3">
                  <Scale className="w-6 h-6 text-[#0F5C5B]" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#647777] block">Pure Gold Balance</span>
                    <div className="text-xl font-bold">
                      <span className={selectedCustomer.currentWT < 0 ? 'text-[#B85C5C]' : 'text-[#0F5C5B]'}>
                        <SBGWeight value={selectedCustomer.currentWT} />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 p-3.5 rounded-xl border border-white/90 flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-[#9A641B]" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#647777] block">Making Charge (Cash)</span>
                    <div className="text-xl font-bold text-[#173333]">
                      <SBGCurrency value={selectedCustomer.currentMC} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settlement Form */}
          <SBGCard variant="glass" className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#DCE5E3] pb-3">
              <h3 className="text-lg font-bold text-[#0F5C5B] flex items-center gap-2">
                <Coins className="w-5 h-5" /> Gold + Cash Settlement Parameters
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  label="Commercial Order (Optional)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  options={[
                    { label: '-- General Customer Settlement --', value: '' },
                    ...customerOrders.map((o) => ({
                      label: `${o.orderNo} - ${o.reference}`,
                      value: o.id,
                    })),
                  ]}
                />
              </div>

              {/* Settlement Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#647777]">
                  Settlement Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'GOLD_AND_CASH', label: 'Gold + Cash' },
                    { id: 'GOLD_ONLY', label: 'Gold Only' },
                    { id: 'CASH_ONLY', label: 'Cash Only' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setSettlementType(mode.id as any)}
                      className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        settlementType === mode.id
                          ? 'bg-[#0F5C5B] text-white border-[#0F5C5B] shadow-sm'
                          : 'bg-white/80 text-[#173333] border-[#DCE5E3] hover:bg-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Values Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0F5C5B]/5 p-5 rounded-2xl border border-[#0F5C5B]/15">
                {(settlementType === 'GOLD_ONLY' || settlementType === 'GOLD_AND_CASH') && (
                  <SBGInput
                    label="Pure Gold Received (g)"
                    type="number"
                    step="0.001"
                    suffixText="grams"
                    value={goldReceived}
                    onChange={(e) => setGoldReceived(parseFloat(e.target.value) || 0)}
                    required
                  />
                )}

                {(settlementType === 'CASH_ONLY' || settlementType === 'GOLD_AND_CASH') && (
                  <SBGInput
                    label="Cash Received (₹)"
                    type="number"
                    step="0.01"
                    suffixText="₹"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    required
                  />
                )}

                <SBGInput
                  label="Agreed Gold Rate (₹/g)"
                  type="number"
                  step="0.01"
                  suffixText="₹/g"
                  value={agreedGoldRate}
                  onChange={(e) => setAgreedGoldRate(parseFloat(e.target.value) || 0)}
                  helperText="Independent settlement gold rate"
                  required
                />
              </div>

              <SBGInput
                label="Settlement Notes / Instrument Reference"
                placeholder="e.g. Bank Ref UTR#992019401 / Gold Bar Ser# 88401..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div className="pt-4 border-t border-[#DCE5E3] flex justify-end gap-3">
                <SBGButton variant="outline" type="button" onClick={() => onNavigate('settlements')}>
                  Cancel
                </SBGButton>
                <SBGButton variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
                  Process & Record Settlement
                </SBGButton>
              </div>
            </form>
          </SBGCard>
        </div>

        {/* Live Settlement Result Preview (1 Col) */}
        <div className="space-y-4">
          <div className="glass-panel-teal p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9B76C] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Result Preview
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-white/80">
                Calculated
              </span>
            </div>

            {/* Side by side comparison: Previous vs Settlement vs New */}
            <div className="space-y-4 text-xs">
              {/* Previous Balance */}
              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <span className="text-[10px] uppercase font-bold text-white/70 block">1. Previous Balance</span>
                <div className="flex justify-between mt-1 font-mono font-bold">
                  <span>WT: {prevWT.toFixed(3)} g</span>
                  <span>MC: ₹{prevMC.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Settlement Inward */}
              <div className="bg-[#D9B76C]/20 p-3 rounded-xl border border-[#D9B76C]/40 text-[#D9B76C]">
                <span className="text-[10px] uppercase font-bold block">2. Settlement Impact</span>
                <div className="flex justify-between mt-1 font-mono font-bold text-white">
                  <span>Gold: -{result.settlementRecord.goldReceived.toFixed(3)} g</span>
                  <span>Cash: -₹{result.settlementRecord.cashReceived.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* New Resulting Balance */}
              <div className="bg-white/20 p-4 rounded-xl border-2 border-[#D9B76C] text-white">
                <span className="text-[11px] uppercase font-black text-[#D9B76C] block">
                  3. New Resulting Ledger Balance
                </span>
                <div className="flex justify-between items-baseline mt-2">
                  <div>
                    <span className="text-[10px] text-white/70 block">New Pure WT:</span>
                    <span className="font-mono font-black text-lg text-white">
                      {result.newBalanceWT.toFixed(3)} g
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/70 block">New MC Balance:</span>
                    <span className="font-mono font-black text-lg text-white">
                      <SBGCurrency value={result.newBalanceMC} className="text-white" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-white/70">
              Gold equivalent value at agreed rate: <strong className="text-[#D9B76C]">₹{result.goldEquivalentValue.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
