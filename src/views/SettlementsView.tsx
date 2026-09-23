import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  Coins,
  Plus,
  Search,
  Repeat,
  Download,
  Gem,
  Scale,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface SettlementsViewProps {
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const SettlementsView: React.FC<SettlementsViewProps> = ({ onNavigate }) => {
  const { settlements, customers } = useSBG();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSettlements = settlements.filter((s) => {
    const cust = customers.find((c) => c.id === s.customerId);
    return (
      s.settlementNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalGoldSettled = settlements.reduce((acc, s) => acc + s.goldReceived, 0);
  const totalCashSettled = settlements.reduce((acc, s) => acc + s.cashReceived, 0);

  return (
    <div className="space-y-6">
      {/* Luxury Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/90 via-white/80 to-[#F5ECE0]/80 p-6 sm:p-8 border border-white/80 shadow-sm overflow-hidden backdrop-blur-md">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0F5C5B]/10 border border-[#0F5C5B]/20 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6 text-[#0F5C5B]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#143B39] tracking-tight">
                Gold & Cash Settlements
              </h1>
              <p className="text-xs text-[#526B6A] mt-1 font-medium">
                Dual settlement workflow for pure weight deductions, cash realizations, and rate fixing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left sm:text-right hidden md:block border-l-2 sm:border-l-0 sm:border-r-2 border-[#D9B76C]/40 pl-3 sm:pl-0 sm:pr-4">
              <span className="text-xs text-[#526B6A] block font-medium">Balanced Accounts</span>
              <span className="text-xs font-bold text-[#C69234] block">Prompt Clearance</span>
            </div>

            <button
              onClick={() => onNavigate('new-settlement')}
              className="px-5 py-2.5 rounded-2xl bg-[#0F5C5B] hover:bg-[#0A4847] text-white font-semibold text-xs shadow-md shadow-[#0F5C5B]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Process New Settlement</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#F2FAF8] border border-[#D5EAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#4B6B68] uppercase tracking-wider">
              TOTAL VOUCHERS
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E2F3F0] flex items-center justify-center">
              <Repeat className="w-4 h-4 text-[#0F5C5B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              {settlements.length}
            </span>
            <span className="text-xs text-[#2E8B57] font-semibold mt-1 block">
              Settlement records
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0D5251] to-[#073635] text-white border border-[#D9B76C]/40 shadow-lg ring-1 ring-[#D9B76C]/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#E7CCA0] uppercase tracking-wider">
              GOLD SETTLED
            </span>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Scale className="w-4 h-4 text-[#D9B76C]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white tracking-tight">
                {totalGoldSettled.toFixed(3)}
              </span>
              <span className="text-xl font-normal text-white/80">g</span>
            </div>
            <span className="text-xs text-[#E9D7A5] font-medium mt-1 block">
              Pure gold adjusted in ledger
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
              CASH REALIZED
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FDF3DE] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#C48C2B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-[26px] font-bold text-[#133837] tracking-tight block font-mono">
              ₹ {totalCashSettled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#7A6D56] font-medium mt-1 block">
              Making charges received
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#F2FAF8] border border-[#D5EAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#4B6B68] uppercase tracking-wider">
              STATUS
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E2F3F0] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#0F5C5B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              100%
            </span>
            <span className="text-xs text-[#2E8B57] font-semibold mt-1 block">
              Audited & Reconciled
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
            placeholder="Search settlement voucher number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B]"
          />
        </div>

        <button
          onClick={() => alert('Exporting Settlement vouchers...')}
          className="px-3 py-2 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium text-xs flex items-center gap-1.5 hover:bg-[#F0EBE1] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#647777]" />
          <span>Export</span>
        </button>
      </div>

      {/* Settlements Table */}
      <div className="rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">VOUCHER NO.</th>
                <th className="py-3.5 px-4">DATE</th>
                <th className="py-3.5 px-4">CUSTOMER</th>
                <th className="py-3.5 px-4">SETTLEMENT MODE</th>
                <th className="py-3.5 px-4 text-right">GOLD RECEIVED</th>
                <th className="py-3.5 px-4 text-right">CASH RECEIVED</th>
                <th className="py-3.5 px-4 text-right">AGREED RATE (₹/g)</th>
                <th className="py-3.5 px-4 text-right font-bold text-[#0F5C5B]">NEW PURE WT</th>
                <th className="py-3.5 px-4 text-right font-bold text-[#0F5C5B]">NEW MC BAL</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {filteredSettlements.map((s) => {
                const customer = customers.find((c) => c.id === s.customerId);

                return (
                  <tr key={s.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-[#0F5C5B]">
                      {s.settlementNo}
                    </td>
                    <td className="py-4 px-4 font-mono text-[#647777]">
                      {s.date}
                    </td>
                    <td className="py-4 px-4 font-bold text-[#173333]">
                      {customer?.name || s.customerName || 'Customer'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FBF4E4] text-[#966E1D]">
                        {s.settlementType === 'GOLD_AND_CASH' ? 'Gold + Cash' : s.settlementType}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-[#0F5C5B]">
                      {s.goldReceived > 0 ? `${s.goldReceived.toFixed(3)} g` : '-'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-[#173333]">
                      {s.cashReceived > 0 ? `₹ ${s.cashReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-[#647777]">
                      ₹ {s.agreedGoldRate.toLocaleString('en-IN')}/g
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold">
                      <span className={s.newBalanceWT < 0 ? 'text-[#C24141]' : 'text-[#1B7C5A]'}>
                        {s.newBalanceWT.toFixed(3)} g
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-[#173333]">
                      ₹ {s.newBalanceMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-[#E6F8F2] text-[#1A825B]">
                        {s.status}
                      </span>
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
