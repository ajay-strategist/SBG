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
  EstimateItemCategory,
  RateUnit,
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
  const { customers, orders, estimates, goldMarketRate, defaultGSTRate, addEstimate, updateEstimate } = useSBG();

  // Find if editing an existing estimate
  const existingEstimate = targetId ? estimates.find((e) => e.id === targetId) : undefined;
  const isEditing = Boolean(isEditMode || existingEstimate);

  const [customerId, setCustomerId] = useState(
    existingEstimate?.customerId || preselectedCustomerId || customers[0]?.id || ''
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
  const [unfixGoldRate, setUnfixGoldRate] = useState<number>(existingEstimate?.unfixGoldRate || 0);
  const [remarks, setRemarks] = useState(existingEstimate?.remarks || '');

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
        rate: 850.0,
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
      setUnfixGoldRate(existingEstimate.unfixGoldRate || 0);
      setRemarks(existingEstimate.remarks || '');
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
      unfixGoldRate: unfixGoldRate || undefined,
      remarks,
      items: items as any,
      balanceComparison: {
        ledgerOldPureWT: selectedCustomer?.currentWT || 0,
        ledgerOldAmount: selectedCustomer?.currentMC || 0,
        gSheetOldPureWT: selectedCustomer?.currentWT || 0,
        gSheetOldAmount: selectedCustomer?.currentMC || 0,
        gSheetNewPureWT: (selectedCustomer?.currentWT || 0) + (items[0]?.pureWT || 0),
        gSheetNewAmount: (selectedCustomer?.currentMC || 0) + 0,
        ledgerNewPureWT: 0,
        ledgerNewAmount: 0,
        pureWTDiff: 0,
        amountDiff: 0,
        isReconciled: true,
      },
    },
    defaultGSTRate
  );

  const handleUpdateLine = (index: number, updates: Partial<EstimateLineItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleAddLine = (category: EstimateItemCategory = 'GOLD') => {
    const defaultRate = category === 'GOLD' ? goldRate : category === 'MAKING_CHARGE' ? 950 : 50000;
    const defaultUnit: RateUnit = category === 'DIAMOND' || category === 'PRECIOUS_STONE' ? 'PER_CT' : 'PER_G';

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

  const handleSaveEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert('Please select a customer account first.');
      return;
    }

    if (existingEstimate) {
      updateEstimate(existingEstimate.id, {
        ...calculatedEstimate,
        id: existingEstimate.id,
        status: existingEstimate.status || 'DRAFT',
      });
      onNavigate('estimate-details', existingEstimate.id);
    } else {
      addEstimate(calculatedEstimate);
      onNavigate('estimate-details', calculatedEstimate.id);
    }
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
            variant="gold"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSaveEstimate}
          >
            {isEditing ? 'Re-Update & Save Cost Sheet' : 'Save & Finalize Estimate'}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#DCE5E3]/60">
          <SBGInput
            label="Base Gold Rate (₹/g)"
            type="number"
            step="0.01"
            value={goldRate}
            onChange={(e) => setGoldRate(parseFloat(e.target.value) || 0)}
          />

          <SBGInput
            label="Gold Rate Purity (%)"
            type="number"
            step="0.1"
            suffixText="%"
            value={goldRatePurity}
            onChange={(e) => setGoldRatePurity(parseFloat(e.target.value) || 99.5)}
          />

          <SBGInput
            label="UNFIX Gold Rate (₹/g)"
            type="number"
            step="0.01"
            placeholder="Optional"
            value={unfixGoldRate || ''}
            onChange={(e) => setUnfixGoldRate(parseFloat(e.target.value) || 0)}
          />
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

          <div className="flex items-center gap-2">
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
                <th className="py-2.5 px-2 text-right w-24">Stone WT (g)</th>
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
              {calculatedEstimate.items.map((line, idx) => (
                <tr key={line.id} className="hover:bg-white/60">
                  <td className="py-2.5 px-2 font-mono text-[#647777]">{idx + 1}</td>
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={line.item}
                      onChange={(e) => handleUpdateLine(idx, { item: e.target.value })}
                      className="w-full text-xs font-semibold px-2 py-1 bg-white border border-[#DCE5E3] rounded-lg focus:outline-none focus:border-[#0F5C5B]"
                    />
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
                    <input
                      type="number"
                      step="0.001"
                      value={line.stoneWT}
                      onChange={(e) => handleUpdateLine(idx, { stoneWT: parseFloat(e.target.value) || 0 })}
                      className="w-20 text-right text-xs px-1.5 py-1 bg-white border border-[#DCE5E3] rounded-lg font-mono text-[#647777]"
                    />
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
              ))}
            </tbody>
          </table>
        </div>
      </SBGCard>

      {/* Totals & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SBGCard variant="glass" className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#647777]">Gold Metal Value</span>
          <div className="text-lg font-bold text-[#0F5C5B]">
            <SBGCurrency value={calculatedEstimate.totals.goldValue} />
          </div>
          <span className="text-[11px] text-[#647777] block font-mono">
            {calculatedEstimate.totals.totalPureWT.toFixed(3)}g Pure Gold
          </span>
        </SBGCard>

        <SBGCard variant="glass" className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#647777]">Diamond & Gemstones</span>
          <div className="text-lg font-bold text-[#173333]">
            <SBGCurrency value={calculatedEstimate.totals.diamondValue + calculatedEstimate.totals.psValue} />
          </div>
          <span className="text-[11px] text-[#647777] block">
            Dmd: ₹{calculatedEstimate.totals.diamondValue.toLocaleString('en-IN')} | PS: ₹{calculatedEstimate.totals.psValue.toLocaleString('en-IN')}
          </span>
        </SBGCard>

        <SBGCard variant="glass" className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#647777]">Making Charges (MC)</span>
          <div className="text-lg font-bold text-[#173333]">
            <SBGCurrency value={calculatedEstimate.totals.mcValue} />
          </div>
          <span className="text-[11px] text-[#647777] block">Craftsmanship fee</span>
        </SBGCard>

        <SBGCard variant="gold" className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8C6A23]">Grand Total (incl. GST)</span>
          <div className="text-xl font-black text-[#173333]">
            <SBGCurrency value={calculatedEstimate.totals.grandTotal} />
          </div>
          <span className="text-[11px] text-[#8C6A23] block">
            Taxable: ₹{calculatedEstimate.totals.taxableValue.toLocaleString('en-IN')} + GST {calculatedEstimate.totals.gstRate}%
          </span>
        </SBGCard>
      </div>

      {/* Balance Reconciliation Comparison Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
          <Scale className="w-4 h-4" /> Estimate vs Customer Ledger Balance Impact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* G SHEET BALANCES */}
          <div className="glass-panel p-5 space-y-3 border-l-4 border-l-[#D9B76C]">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A23]">
                G Sheet Position
              </span>
              <SBGBadge variant="gold">Formula Linked</SBGBadge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#647777] block text-[10px] uppercase">Old Pure WT</span>
                <span className="font-mono font-bold">{(selectedCustomer?.currentWT || 0).toFixed(3)} g</span>
              </div>
              <div>
                <span className="text-[#647777] block text-[10px] uppercase">Old Amount</span>
                <SBGCurrency value={selectedCustomer?.currentMC || 0} />
              </div>
              <div className="pt-2 border-t border-[#DCE5E3]">
                <span className="text-[#647777] block text-[10px] uppercase">New Pure WT</span>
                <span className="font-mono font-bold text-sm text-[#0F5C5B]">
                  {((selectedCustomer?.currentWT || 0) + calculatedEstimate.totals.totalPureWT).toFixed(3)} g
                </span>
              </div>
              <div className="pt-2 border-t border-[#DCE5E3]">
                <span className="text-[#647777] block text-[10px] uppercase">New Total Amount</span>
                <SBGCurrency
                  value={(selectedCustomer?.currentMC || 0) + calculatedEstimate.totals.grandTotal}
                  className="text-sm font-bold text-[#0F5C5B]"
                />
              </div>
            </div>
          </div>

          {/* LEDGER BALANCE */}
          <div className="glass-panel p-5 space-y-3 border-l-4 border-l-[#0F5C5B]">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B]">
                Ledger Balance Sync
              </span>
              <SBGBadge variant="success">Reconciled</SBGBadge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#647777] block text-[10px] uppercase">Ledger Pure WT</span>
                <span className="font-mono font-bold">{(selectedCustomer?.currentWT || 0).toFixed(3)} g</span>
              </div>
              <div>
                <span className="text-[#647777] block text-[10px] uppercase">Ledger MC Balance</span>
                <SBGCurrency value={selectedCustomer?.currentMC || 0} />
              </div>
              <div className="pt-2 border-t border-[#DCE5E3]">
                <span className="text-[#647777] block text-[10px] uppercase">Delta Pure WT</span>
                <span className="font-mono font-bold text-sm text-[#0F5C5B]">
                  + {calculatedEstimate.totals.totalPureWT.toFixed(3)} g
                </span>
              </div>
              <div className="pt-2 border-t border-[#DCE5E3]">
                <span className="text-[#647777] block text-[10px] uppercase">Delta MC / Amount</span>
                <SBGCurrency
                  value={calculatedEstimate.totals.grandTotal}
                  className="text-sm font-bold text-[#0F5C5B]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
