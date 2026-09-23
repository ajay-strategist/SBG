import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  FileSpreadsheet,
  Plus,
  Search,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Download,
  Gem,
  Coins,
  FileText,
  Edit3,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface EstimatesViewProps {
  onNavigate: (tab: ActiveTab, estimateId?: string) => void;
}

export const EstimatesView: React.FC<EstimatesViewProps> = ({ onNavigate }) => {
  const { estimates, customers } = useSBG();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEstimates = estimates.filter((e) => {
    const cust = customers.find((c) => c.id === e.customerId);
    return (
      e.estimateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.customerRef && e.customerRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cust && cust.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Luxury Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/90 via-white/80 to-[#F5ECE0]/80 p-6 sm:p-8 border border-white/80 shadow-sm overflow-hidden backdrop-blur-md">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C48C2B]/10 border border-[#C48C2B]/20 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-[#C48C2B]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#143B39] tracking-tight">
                SBG Estimates & Cost Sheets
              </h1>
              <p className="text-xs text-[#526B6A] mt-1 font-medium">
                Multi-tier dynamic item rates, making charge formulas, and automatic balance reconciliation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left sm:text-right hidden md:block border-l-2 sm:border-l-0 sm:border-r-2 border-[#D9B76C]/40 pl-3 sm:pl-0 sm:pr-4">
              <span className="text-xs text-[#526B6A] block font-medium">Exact Costing</span>
              <span className="text-xs font-bold text-[#C69234] block">Zero Discrepancy</span>
            </div>

            <button
              onClick={() => onNavigate('new-estimate')}
              className="px-5 py-2.5 rounded-2xl bg-[#E5C378] hover:bg-[#D9B76C] text-[#3D2D0C] font-bold text-xs shadow-md shadow-[#D9B76C]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Estimate</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#F2FAF8] border border-[#D5EAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#4B6B68] uppercase tracking-wider">
              TOTAL ESTIMATES
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E2F3F0] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#0F5C5B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              {estimates.length}
            </span>
            <span className="text-xs text-[#2E8B57] font-semibold mt-1 block">
              Generated this month
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
              RECONCILED SHEETS
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FDF3DE] flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-[#C48C2B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              {estimates.filter((e) => e.balanceComparison.isReconciled).length}
            </span>
            <span className="text-xs text-[#2E8B57] font-medium mt-1 block">
              100% Match with Ledger
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#F2FAF8] border border-[#D5EAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#4B6B68] uppercase tracking-wider">
              PENDING REVIEW
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E2F3F0] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#0F5C5B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              {estimates.filter((e) => !e.balanceComparison.isReconciled).length}
            </span>
            <span className="text-xs text-[#B87B1D] font-semibold mt-1 block">
              Awaiting Verification
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
              TOTAL ESTIMATE VALUE
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FDF3DE] flex items-center justify-center">
              <Coins className="w-4 h-4 text-[#C48C2B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-[26px] font-bold text-[#133837] tracking-tight block font-mono">
              ₹ {estimates.reduce((acc, e) => acc + e.totals.grandTotal, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#7A6D56] font-medium mt-1 block">
              Cumulative grand total
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 text-[#647777] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Estimate No., customer, or customer reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B]"
          />
        </div>

        <button
          onClick={() => alert('Exporting Estimates dataset...')}
          className="px-3 py-2 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium text-xs flex items-center gap-1.5 hover:bg-[#F0EBE1] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#647777]" />
          <span>Export</span>
        </button>
      </div>

      {/* Estimates Table */}
      <div className="rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ESTIMATE NO.</th>
                <th className="py-3.5 px-4">CUSTOMER</th>
                <th className="py-3.5 px-4">DATE</th>
                <th className="py-3.5 px-4 text-right">PURE WT (g)</th>
                <th className="py-3.5 px-4 text-right">TAXABLE VALUE</th>
                <th className="py-3.5 px-4 text-right">GST (3%)</th>
                <th className="py-3.5 px-4 text-right font-bold text-[#0F5C5B]">GRAND TOTAL</th>
                <th className="py-3.5 px-4 text-center">RECONCILIATION</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {filteredEstimates.map((est) => {
                const customer = customers.find((c) => c.id === est.customerId);
                const isReconciled = est.balanceComparison.isReconciled;

                return (
                  <tr
                    key={est.id}
                    onClick={() => onNavigate('estimate-details', est.id)}
                    className="hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-[#0F5C5B]">
                      {est.estimateNo}
                    </td>
                    <td className="py-4 px-4 font-semibold text-[#173333]">
                      {customer?.name || est.customerName || 'Customer'}
                    </td>
                    <td className="py-4 px-4 text-[#647777] font-mono">
                      {est.estimateDate}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-[#0F5C5B]">
                      {est.totals.totalPureWT.toFixed(3)} g
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-[#173333]">
                      ₹ {est.totals.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-[#647777]">
                      ₹ {est.totals.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-sm text-[#0F5C5B]">
                      ₹ {est.totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isReconciled
                            ? 'bg-[#E6F8F2] text-[#1A825B]'
                            : 'bg-[#FEF5E6] text-[#B87B1D]'
                        }`}
                      >
                        {isReconciled ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {isReconciled ? 'Reconciled' : 'Attention'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                          est.status === 'CONFIRMED'
                            ? 'bg-[#E6F8F2] text-[#1A825B]'
                            : est.status === 'PENDING'
                            ? 'bg-[#FEF5E6] text-[#B87B1D]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {est.status}
                      </span>
                    </td>
                    <td
                      className="py-4 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onNavigate('edit-estimate', est.id)}
                          className="px-2.5 py-1 rounded-xl bg-[#FAF6EE] hover:bg-[#F3ECE0] border border-[#D9B76C]/40 text-xs font-semibold text-[#8C6D23] flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => onNavigate('estimate-details', est.id)}
                          className="px-2.5 py-1 rounded-xl bg-white border border-[#DCE5E3] hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F5C5B] cursor-pointer transition-all"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
