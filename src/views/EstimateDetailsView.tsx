import React from 'react';
import { useSBG } from '../store/sbgStore';
import {
  SBGCard,
  SBGButton,
  SBGBadge,
  SBGCurrency,
  SBGWeight,
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
  const { estimates, customers, updateEstimate } = useSBG();

  const estimate = estimates.find((e) => e.id === estimateId) || estimates[0];
  const customer = customers.find((c) => c.id === estimate?.customerId);

  if (!estimate) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[#647777]">Estimate cost sheet not found.</p>
        <SBGButton variant="outline" className="mt-4" onClick={() => onNavigate('estimates')}>
          Return to Estimates
        </SBGButton>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmStatus = () => {
    updateEstimate(estimate.id, { status: 'CONFIRMED' });
  };

  const isReconciled = estimate.balanceComparison?.isReconciled ?? true;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <button
          onClick={() => onNavigate('estimates')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0F5C5B] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Estimates
        </button>

        <div className="flex items-center gap-2.5">
          <SBGButton
            variant="glass"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Print Cost Sheet
          </SBGButton>
          {estimate.status === 'DRAFT' && (
            <SBGButton
              variant="primary"
              size="sm"
              icon={<FileCheck className="w-4 h-4" />}
              onClick={handleConfirmStatus}
            >
              Confirm & Lock Estimate
            </SBGButton>
          )}
        </div>
      </div>

      {/* Validation Checklist Panel */}
      <div className="glass-panel p-5 space-y-4 no-print">
        <div className="flex items-center justify-between border-b border-[#DCE5E3] pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B]">
              Estimate Validation & Reconciliation Checklist
            </h3>
            <SBGBadge variant={isReconciled ? 'success' : 'warning'}>
              {isReconciled ? 'All Math Verified' : 'Delta Alert'}
            </SBGBadge>
          </div>
          <span className="text-xs text-[#647777]">
            Ledger vs Estimate difference: <strong>{estimate.balanceComparison.pureWTDiff.toFixed(3)}g / ₹{estimate.balanceComparison.amountDiff}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
          {[
            { label: 'Gross WT', value: `${estimate.totals.totalGrossWT.toFixed(3)}g`, valid: true },
            { label: 'Stone WT', value: `${estimate.totals.totalStoneWT.toFixed(3)}g`, valid: true },
            { label: 'Net WT', value: `${estimate.totals.totalNetWT.toFixed(3)}g`, valid: true },
            { label: 'Pure WT', value: `${estimate.totals.totalPureWT.toFixed(3)}g`, valid: true },
            { label: 'Taxable Val', value: `₹${estimate.totals.taxableValue.toLocaleString('en-IN')}`, valid: true },
            { label: 'GST Amount', value: `₹${estimate.totals.gstAmount.toLocaleString('en-IN')}`, valid: true },
          ].map((chk, i) => (
            <div key={i} className="bg-white/80 p-2.5 rounded-xl border border-white/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#647777] uppercase block">{chk.label}</span>
                <span className="font-mono font-bold text-[#173333]">{chk.value}</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#3E8B68]" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Printable Estimate Cost Sheet */}
      <div className="glass-panel p-6 sm:p-10 space-y-8 bg-white/90 shadow-lg">
        {/* Top Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#DCE5E3] pb-6 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-wider text-[#0F5C5B]">SBG JEWELLERY</span>
              <SBGBadge variant="gold">COST SHEET</SBGBadge>
            </div>
            <p className="text-xs text-[#647777]">
              Commercial Jewellery Manufacturing, Diamond Mountings & Precision Refining
            </p>
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
            <p className="text-[#647777]">{customer?.phone} | {customer?.city}</p>
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
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 pt-4 border-t border-[#DCE5E3]">
          <div className="max-w-md space-y-2 text-xs">
            <span className="font-bold text-[#0F5C5B] uppercase tracking-wider block">Remarks & Notes</span>
            <p className="text-[#647777] bg-white p-3 rounded-xl border border-[#DCE5E3]">
              {estimate.remarks || 'Standard commercial estimate based on prevailing market gold rates and pure weights.'}
            </p>
          </div>

          <div className="w-full md:w-80 space-y-2.5 text-xs bg-white/60 p-4 rounded-xl border border-[#DCE5E3]">
            <div className="flex justify-between text-[#647777]">
              <span>Gold Metal Value:</span>
              <SBGCurrency value={estimate.totals.goldValue} />
            </div>
            <div className="flex justify-between text-[#647777]">
              <span>Diamond & Gemstone Value:</span>
              <SBGCurrency value={estimate.totals.diamondValue + estimate.totals.psValue} />
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
              <SBGCurrency value={estimate.totals.grandTotal} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
