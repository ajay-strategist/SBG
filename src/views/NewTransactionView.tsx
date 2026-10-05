import React, { useState, useCallback } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  SBGCard,
  SBGButton,
  SBGInput,
  SBGSelect,
  SBGCurrency,
} from '../components/ui';
import {
  calculateNetWT,
  calculatePureWT,
  calculateTotalAmount,
  stoneCaratsToGrams,
  TransactionDirection,
  ParticularsType,
} from '../core/calculations';
import {
  BookOpen,
  ArrowLeft,
  Calculator,
  Sparkles,
  Save,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface NewTransactionViewProps {
  preselectedCustomerId?: string;
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

interface LineItem {
  id: string;
  description: string;
  erpRef: string;
  nos: number;
  grossWT: number;
  stoneWT: number;
  stoneWTCarats: number;
  touch: number;
  stoneAmount: number;
  mcRate: number;
  mcAmount: number;
}

const emptyLine = (): LineItem => ({
  id: Math.random().toString(36).slice(2),
  description: '',
  erpRef: '',
  nos: 1,
  grossWT: 0,
  stoneWT: 0,
  stoneWTCarats: 0,
  touch: 76,
  stoneAmount: 0,
  mcRate: 0,
  mcAmount: 0,
});

const sampleLine = (): LineItem => ({
  id: Math.random().toString(36).slice(2),
  description: '18K Diamond Castings Received',
  erpRef: 'RD/BB/094/26-27',
  nos: 22,
  grossWT: 18.476,
  stoneWT: 0.906,
  stoneWTCarats: 4.53,
  touch: 76.0,
  stoneAmount: 0,
  mcRate: 948.98,
  mcAmount: 16673.58,
});

function deriveLineCalcs(item: LineItem, direction: TransactionDirection) {
  const netWT = calculateNetWT(item.grossWT, item.stoneWT, direction);
  const pureWT = calculatePureWT(netWT, item.touch);
  const mcAmountCal = direction === 'RECEIPT' ? -Math.abs(item.mcAmount) : Math.abs(item.mcAmount);
  const stoneAmountCal = direction === 'RECEIPT' ? -Math.abs(item.stoneAmount) : Math.abs(item.stoneAmount);
  const totalAmount = calculateTotalAmount(stoneAmountCal, mcAmountCal);
  return { netWT, pureWT, mcAmountCal, stoneAmountCal, totalAmount };
}

export const NewTransactionView: React.FC<NewTransactionViewProps> = ({
  preselectedCustomerId,
  onNavigate,
}) => {
  const { customers, orders, addTransaction } = useSBG();

  const [customerId, setCustomerId] = useState(preselectedCustomerId || customers[0]?.id || '');
  const [orderId, setOrderId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [direction, setDirection] = useState<TransactionDirection>('RECEIPT');
  const [particulars, setParticulars] = useState<ParticularsType>('PURCHASE');
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerOrders = orders.filter((o) => o.customerId === customerId);

  const updateLine = useCallback((id: string, patch: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };
        if ('mcRate' in patch) {
          const netWt = Math.abs(updated.grossWT - updated.stoneWT);
          updated.mcAmount = +(netWt * updated.mcRate).toFixed(2);
        }
        if ('stoneWT' in patch && !('stoneWTCarats' in patch)) {
          updated.stoneWTCarats = updated.stoneWT > 0 ? +(updated.stoneWT / 0.2).toFixed(3) : 0;
        }
        if ('stoneWTCarats' in patch && !('stoneWT' in patch)) {
          updated.stoneWT = stoneCaratsToGrams(updated.stoneWTCarats);
        }
        return updated;
      })
    );
  }, []);

  const addLine = () => setLineItems((prev) => [...prev, emptyLine()]);

  const duplicateLine = (id: string) => {
    setLineItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: Math.random().toString(36).slice(2) };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const removeLine = (id: string) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  };

  const handleLoadSampleSpec = () => {
    setDirection('RECEIPT');
    setParticulars('PURCHASE');
    setLineItems([sampleLine()]);
  };

  const totals = lineItems.reduce(
    (acc, item) => {
      const c = deriveLineCalcs(item, direction);
      return {
        nos: acc.nos + item.nos,
        grossWT: acc.grossWT + item.grossWT,
        stoneWT: acc.stoneWT + item.stoneWT,
        netWT: acc.netWT + c.netWT,
        pureWT: acc.pureWT + c.pureWT,
        stoneAmount: acc.stoneAmount + c.stoneAmountCal,
        mcAmount: acc.mcAmount + c.mcAmountCal,
        totalAmount: acc.totalAmount + c.totalAmount,
      };
    },
    { nos: 0, grossWT: 0, stoneWT: 0, netWT: 0, pureWT: 0, stoneAmount: 0, mcAmount: 0, totalAmount: 0 }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || isSaving) return;
    setIsSaving(true);

    for (const item of lineItems) {
      const { netWT, pureWT, mcAmountCal, stoneAmountCal, totalAmount } = deriveLineCalcs(item, direction);
      await addTransaction({
        customerId,
        orderId: orderId || undefined,
        date,
        direction,
        particulars,
        description: item.description || '(No description)',
        nos: item.nos,
        grossWT: item.grossWT,
        stoneWT: item.stoneWT,
        stoneWTCarat: item.stoneWTCarats,
        netWT,
        touch: item.touch,
        pureWT,
        stoneAmount: item.stoneAmount,
        stoneAmountCal,
        mcRate: item.mcRate,
        mcAmount: item.mcAmount,
        mcAmountCal,
        totalAmount,
        status: 'CONFIRMED',
        erpRef: item.erpRef || undefined,
      });
    }

    setSavedSuccess(true);
    setIsSaving(false);
    setTimeout(() => {
      onNavigate('customer-profile', customerId);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('ledger')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0F5C5B] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Ledger
        </button>
        <SBGButton
          variant="gold"
          size="sm"
          icon={<Sparkles className="w-4 h-4" />}
          onClick={handleLoadSampleSpec}
        >
          Load Sample Spec (18.476g, 76%)
        </SBGButton>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Transaction Header */}
            <SBGCard variant="glass" className="p-6 space-y-5">
              <div className="border-b border-[#DCE5E3] pb-4">
                <h2 className="text-xl font-bold text-[#0F5C5B] flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Record Ledger Transaction
                </h2>
                <p className="text-xs text-[#647777] mt-0.5">
                  Enter header details once — add multiple items below
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SBGSelect
                  label="Customer Account"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  options={customers.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }))}
                  required
                />
                <SBGSelect
                  label="Commercial Order (Optional)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  options={[
                    { label: '-- No Specific Order (Direct Ledger) --', value: '' },
                    ...customerOrders.map((o) => ({ label: `${o.orderNo} - ${o.reference}`, value: o.id })),
                  ]}
                />
                <SBGInput
                  label="Transaction Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <SBGSelect
                  label="Transaction Direction"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as TransactionDirection)}
                  options={[
                    { label: 'RECEIPT (Inward / Purchase / Customer Credit)', value: 'RECEIPT' },
                    { label: 'ISSUE (Outward / Issue to Karigar / Debit)', value: 'ISSUE' },
                  ]}
                  required
                />
                <SBGSelect
                  label="Particulars"
                  value={particulars}
                  onChange={(e) => setParticulars(e.target.value as ParticularsType)}
                  options={[
                    { label: 'PURCHASE', value: 'PURCHASE' },
                    { label: 'SALE', value: 'SALE' },
                    { label: 'RECEIPT', value: 'RECEIPT' },
                    { label: 'ISSUE', value: 'ISSUE' },
                    { label: 'RETURN', value: 'RETURN' },
                    { label: 'SETTLEMENT', value: 'SETTLEMENT' },
                    { label: 'ADJUSTMENT', value: 'ADJUSTMENT' },
                  ]}
                  required
                />
              </div>
            </SBGCard>

            {/* Line Items */}
            <SBGCard variant="glass" className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F5C5B] flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Line Items
                  <span className="ml-1 text-[10px] font-semibold bg-[#0F5C5B]/10 text-[#0F5C5B] px-2 py-0.5 rounded-full">
                    {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
                  </span>
                </h3>
                <SBGButton
                  variant="outline"
                  size="sm"
                  type="button"
                  icon={<PlusCircle className="w-4 h-4" />}
                  onClick={addLine}
                >
                  Add Item
                </SBGButton>
              </div>

              <div className="space-y-4">
                {lineItems.map((item, idx) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    index={idx}
                    direction={direction}
                    canRemove={lineItems.length > 1}
                    onChange={(patch) => updateLine(item.id, patch)}
                    onRemove={() => removeLine(item.id)}
                    onDuplicate={() => duplicateLine(item.id)}
                  />
                ))}
              </div>

              {lineItems.length > 1 && (
                <div className="mt-2 pt-4 border-t border-[#0F5C5B]/20 grid grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'Total Nos', value: String(totals.nos) },
                    { label: 'Total Gross WT', value: `${totals.grossWT.toFixed(3)} g` },
                    { label: 'Total Pure WT', value: `${totals.pureWT.toFixed(3)} g` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#0F5C5B]/5 rounded-xl p-3 text-center">
                      <p className="text-[#647777] mb-1">{label}</p>
                      <p className="font-bold text-[#0F5C5B] text-sm">{value}</p>
                    </div>
                  ))}
                  <div className="bg-[#0F5C5B]/5 rounded-xl p-3 text-center">
                    <p className="text-[#647777] mb-1">Total Amount</p>
                    <p className="font-bold text-[#0F5C5B] text-sm">
                      <SBGCurrency value={totals.totalAmount} />
                    </p>
                  </div>
                </div>
              )}
            </SBGCard>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#647777]">
                {lineItems.length} transaction{lineItems.length !== 1 ? 's' : ''} will be saved to this customer's ledger
              </span>
              <div className="flex gap-3">
                <SBGButton variant="outline" type="button" onClick={() => onNavigate('ledger')}>
                  Cancel
                </SBGButton>
                <SBGButton
                  variant="primary"
                  type="submit"
                  icon={savedSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : savedSuccess ? 'Saved!' : `Save ${lineItems.length > 1 ? `${lineItems.length} Items` : 'Transaction'}`}
                </SBGButton>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass-panel-teal p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D9B76C] flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" /> Engine Precision Output
                </span>
                <span className="text-[10px] bg-white/15 px-2.5 py-0.5 rounded-md font-mono text-emerald-200 border border-white/20">
                  {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Direction', value: direction === 'RECEIPT' ? '−1 Inward' : '+1 Outward' },
                  { label: 'Total Gross WT', value: `${totals.grossWT.toFixed(3)} g` },
                  { label: 'Total Stone WT', value: `${totals.stoneWT.toFixed(3)} g` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/15">
                    <span className="text-emerald-100 font-medium">{label}:</span>
                    <span className="font-mono font-bold text-white">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-1.5 border-b border-white/15">
                  <span className="text-emerald-100 font-medium">Total Net WT:</span>
                  <span className="font-mono font-bold text-base text-[#D9B76C]">{totals.netWT.toFixed(3)} g</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/15">
                  <span className="text-emerald-100 font-medium">Total Pure WT:</span>
                  <span className="font-mono font-black text-lg text-white">{totals.pureWT.toFixed(3)} g</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/15">
                  <span className="text-emerald-100 font-medium">Total Stone Amt:</span>
                  <span className="font-mono font-bold text-white">
                    <SBGCurrency value={totals.stoneAmount} className="text-white" />
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-emerald-100 font-medium">Total MC Amt:</span>
                  <span className="font-mono font-bold text-white">
                    <SBGCurrency value={totals.mcAmount} className="text-white" />
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-3 border-t border-white/20 flex justify-between items-center">
                <span className="text-xs font-bold text-[#D9B76C] uppercase tracking-wide">Grand Total</span>
                <span className="font-mono font-black text-xl text-white">
                  <SBGCurrency value={totals.totalAmount} className="text-white" />
                </span>
              </div>
            </div>

            {selectedCustomer && (
              <SBGCard variant="glass" className="p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B]">
                  Customer Balance Impact
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#647777]">Current Pure WT:</span>
                    <span className="font-mono font-bold">{selectedCustomer.currentWT.toFixed(3)} g</span>
                  </div>
                  <div className="flex justify-between text-[#0F5C5B]">
                    <span className="font-semibold">+ This Batch:</span>
                    <span className="font-mono font-bold">{totals.pureWT.toFixed(3)} g</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#DCE5E3] font-bold">
                    <span>Projected Pure WT:</span>
                    <span className="font-mono text-sm text-[#0F5C5B]">
                      {(selectedCustomer.currentWT + totals.pureWT).toFixed(3)} g
                    </span>
                  </div>
                  <div className="flex justify-between text-[#647777]">
                    <span>Current Balance MC:</span>
                    <span className="font-mono font-bold">
                      <SBGCurrency value={selectedCustomer.currentMC} />
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#DCE5E3] font-bold">
                    <span>Projected Balance MC:</span>
                    <span className="font-mono text-sm text-[#0F5C5B]">
                      <SBGCurrency value={selectedCustomer.currentMC + totals.totalAmount} />
                    </span>
                  </div>
                </div>
              </SBGCard>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

// ─── Line Item Row Sub-component ───────────────────────────────────────────────
interface LineItemRowProps {
  item: LineItem;
  index: number;
  direction: TransactionDirection;
  canRemove: boolean;
  onChange: (patch: Partial<LineItem>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

const LineItemRow: React.FC<LineItemRowProps> = ({
  item,
  index,
  direction,
  canRemove,
  onChange,
  onRemove,
  onDuplicate,
}) => {
  const { netWT, pureWT, totalAmount } = deriveLineCalcs(item, direction);

  return (
    <div className="bg-[#0F5C5B]/5 border border-[#0F5C5B]/15 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#0F5C5B] bg-[#0F5C5B]/10 px-3 py-1 rounded-full">
          Item #{index + 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Duplicate item"
            onClick={onDuplicate}
            className="p-1.5 rounded-lg text-[#0F5C5B]/60 hover:text-[#0F5C5B] hover:bg-[#0F5C5B]/10 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {canRemove && (
            <button
              type="button"
              title="Remove item"
              onClick={onRemove}
              className="p-1.5 rounded-lg text-red-400/70 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <SBGInput
            label="Description"
            placeholder="e.g. 18K Diamond Castings Received"
            value={item.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
        <SBGInput
          label="ERP / Stock Ref"
          placeholder="e.g. RD/BB/094"
          value={item.erpRef}
          onChange={(e) => onChange({ erpRef: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SBGInput
          label="Nos"
          type="number"
          value={item.nos}
          onChange={(e) => onChange({ nos: parseInt(e.target.value) || 1 })}
        />
        <SBGInput
          label="Gross WT (g)"
          type="number"
          step="0.001"
          value={item.grossWT}
          onChange={(e) => onChange({ grossWT: parseFloat(e.target.value) || 0 })}
        />
        <SBGInput
          label="Stone WT (g)"
          type="number"
          step="0.001"
          value={item.stoneWT}
          onChange={(e) => onChange({ stoneWT: parseFloat(e.target.value) || 0 })}
        />
        <SBGInput
          label="Touch (%)"
          type="number"
          step="0.01"
          value={item.touch}
          onChange={(e) => onChange({ touch: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SBGInput
          label="MC Rate (₹/g)"
          type="number"
          step="0.01"
          value={item.mcRate}
          onChange={(e) => onChange({ mcRate: parseFloat(e.target.value) || 0 })}
        />
        <SBGInput
          label="MC Amount (₹)"
          type="number"
          step="0.01"
          value={item.mcAmount}
          onChange={(e) => onChange({ mcAmount: parseFloat(e.target.value) || 0 })}
        />
        <SBGInput
          label="Stone Amount (₹)"
          type="number"
          step="0.01"
          value={item.stoneAmount}
          onChange={(e) => onChange({ stoneAmount: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="bg-white/60 rounded-lg px-3 py-2 text-center border border-[#0F5C5B]/10">
          <p className="text-[#647777]">Net WT</p>
          <p className="font-bold text-[#0F5C5B] font-mono">{netWT.toFixed(3)} g</p>
        </div>
        <div className="bg-white/60 rounded-lg px-3 py-2 text-center border border-[#0F5C5B]/10">
          <p className="text-[#647777]">Pure WT</p>
          <p className="font-bold text-[#0F5C5B] font-mono">{pureWT.toFixed(3)} g</p>
        </div>
        <div className="bg-white/60 rounded-lg px-3 py-2 text-center border border-[#0F5C5B]/10">
          <p className="text-[#647777]">Total Amt</p>
          <p className="font-bold text-[#0F5C5B] font-mono text-[10px]">
            <SBGCurrency value={totalAmount} />
          </p>
        </div>
      </div>
    </div>
  );
};
