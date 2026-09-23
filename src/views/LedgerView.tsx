import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  BookOpen,
  Printer,
  Plus,
  Search,
  Calendar,
  ChevronDown,
  RotateCcw,
  BarChart2,
  SlidersHorizontal,
  Download,
  Maximize2,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  MoreHorizontal,
  Scale,
  Wallet,
  FileText,
  Gem,
  TableProperties,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface LedgerViewProps {
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ onNavigate }) => {
  const { customers, transactions } = useSBG();
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [particularsFilter, setParticularsFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Map dynamic transactions with customer metadata and filters
  const displayTransactions = transactions
    .map((tx) => {
      const cust = customers.find((c) => c.id === tx.customerId);
      return {
        id: tx.id,
        date: tx.date,
        customerName: cust?.name || 'Customer Account',
        customerCode: cust?.code || 'SBG-C---',
        customerId: tx.customerId,
        dir: tx.direction,
        particulars: tx.particulars,
        description: tx.description || 'Transaction entry',
        erpRef: tx.erpRef || '-',
        nos: tx.nos || null,
        grossWT: tx.grossWT || 0,
        stoneWT: tx.stoneWT || 0,
        netWT: tx.netWT || 0,
        touch: tx.touch || 0,
        pureWT: tx.pureWT || 0,
        totalMC: tx.totalAmount || tx.mcAmount || 0,
        balWT: tx.balanceWT || 0,
        balMC: tx.balanceMC || 0,
        status: tx.status || 'CONFIRMED',
      };
    })
    .filter((tx) => {
      const matchesSearch =
        tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.erpRef && tx.erpRef.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCustomer = customerFilter === 'ALL' || tx.customerId === customerFilter;
      const matchesDir = directionFilter === 'ALL' || tx.dir === directionFilter;
      const matchesPart = particularsFilter === 'ALL' || tx.particulars === particularsFilter;
      const matchesStat = statusFilter === 'ALL' || tx.status === statusFilter;

      return matchesSearch && matchesCustomer && matchesDir && matchesPart && matchesStat;
    });

  const handleSelectAll = () => {
    if (selectedIds.length === displayTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayTransactions.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/90 via-white/80 to-[#F5ECE0]/80 p-6 sm:p-8 border border-white/80 shadow-sm overflow-hidden backdrop-blur-md">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0F5C5B]/10 border border-[#0F5C5B]/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-[#0F5C5B]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#143B39] tracking-tight">
                Customer Ledger & Transaction Engine
              </h1>
              <p className="text-xs text-[#526B6A] mt-1 font-medium">
                Complete transaction history with real-time balances and calculation engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Slogan box */}
            <div className="hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FAF6EE] border border-[#E8DFC8]">
              <Gem className="w-4 h-4 text-[#D9B76C]" />
              <div className="text-left text-[11px] leading-tight">
                <span className="font-semibold text-[#143B39] block">Accurate Ledgers</span>
                <span className="text-[#647777] font-medium block">Stronger Partnerships</span>
              </div>
            </div>

            {/* Print Statement Button */}
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FAF9F6] border border-[#DCE5E3] text-[#173333] font-semibold text-xs shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4 text-[#647777]" />
              <span>Print Statement</span>
            </button>

            {/* Record New Transaction Button */}
            <button
              onClick={() => onNavigate('new-transaction')}
              className="px-5 py-2.5 rounded-2xl bg-[#0F5C5B] hover:bg-[#0A4847] text-white font-semibold text-xs shadow-md shadow-[#0F5C5B]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Transaction</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL TRANSACTIONS */}
        <div className="p-5 rounded-2xl bg-[#F2FAF8] border border-[#D5EAE5] shadow-xs relative overflow-hidden flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#4B6B68] uppercase tracking-wider">
                TOTAL TRANSACTIONS
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-[#133837] tracking-tight block">
                {transactions.length}
              </span>
              <div className="flex items-center gap-1 text-xs text-[#2E8B57] font-semibold mt-1">
                <span>●</span> Live Ledger Entries
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#E2F3F0] flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-[#0F5C5B]" />
          </div>
        </div>

        {/* Card 2: CURRENT PURE WT BALANCE */}
        {(() => {
          const totalWT = customers.reduce((sum, c) => sum + (c.currentWT || 0), 0);
          return (
            <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs relative overflow-hidden flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
                    CURRENT PURE WT BALANCE
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#133837] tracking-tight">
                      {totalWT.toFixed(3)}
                    </span>
                    <span className="text-xl font-normal text-[#133837]/80">g</span>
                  </div>
                  <div className="text-xs text-[#7A6D56] font-medium mt-1">
                    Across all customers
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#FDF3DE] flex items-center justify-center">
                <Scale className="w-4 h-4 text-[#C48C2B]" />
              </div>
            </div>
          );
        })()}

        {/* Card 3: CURRENT MC BALANCE */}
        {(() => {
          const totalMC = customers.reduce((sum, c) => sum + (c.currentMC || 0), 0);
          return (
            <div className="p-5 rounded-2xl bg-[#F2FAF8] border border-[#D5EAE5] shadow-xs relative overflow-hidden flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#4B6B68] uppercase tracking-wider">
                    CURRENT MC BALANCE
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-[26px] font-bold text-[#133837] tracking-tight block font-mono">
                    ₹ {totalMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="text-xs text-[#4B6B68] font-medium mt-1">
                    Across all customers
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#E2F3F0] flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#0F5C5B]" />
              </div>
            </div>
          );
        })()}

        {/* Card 4: LAST TRANSACTION */}
        {(() => {
          const latestTx = transactions.length > 0 ? transactions[transactions.length - 1] : null;
          const latestCust = latestTx ? customers.find((c) => c.id === latestTx.customerId) : null;

          return (
            <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs relative overflow-hidden flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
                    LAST TRANSACTION
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-bold text-[#133837] tracking-tight block font-mono">
                    {latestTx ? latestTx.date : 'No entries'}
                  </span>
                  <div className="text-xs text-[#7A6D56] font-medium mt-1 truncate max-w-[150px]">
                    {latestCust ? latestCust.name : 'Awaiting transactions'}
                  </div>
                </div>
              </div>
              {latestCust && (
                <button
                  onClick={() => onNavigate('customer-profile', latestCust.id)}
                  className="w-8 h-8 rounded-xl bg-white border border-[#EFE5D0] flex items-center justify-center hover:bg-[#F5ECE0] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-[#C48C2B]" />
                </button>
              )}
            </div>
          );
        })()}
      </div>

      {/* Advanced Filter and Control Bar (2 Rows) */}
      <div className="p-4 rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md space-y-3">
        {/* Row 1 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[280px] relative">
            <Search className="w-4 h-4 text-[#647777] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, customer, particulars, ERP ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B]"
            />
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#DCE5E3] text-xs font-medium text-[#173333] cursor-pointer">
            <Calendar className="w-3.5 h-3.5 text-[#647777]" />
            <span>01 Sep 2026</span>
            <span className="text-[#647777]">→</span>
            <span>22 Sep 2026</span>
            <ChevronDown className="w-3 h-3 text-[#647777]" />
          </div>

          {/* Account Filter */}
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Customer Accounts</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Directions</option>
            <option value="ISSUE">↗ ISSUE</option>
            <option value="RECEIPT">↘ RECEIPT</option>
          </select>
        </div>

        {/* Row 2 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#EFECE6]/80">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={particularsFilter}
              onChange={(e) => setParticularsFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Particulars</option>
              <option value="PURCHASE">Purchase</option>
              <option value="SALES">Sales</option>
              <option value="PAYMENT RECEIVED">Payment Received</option>
              <option value="PAYMENT PAID">Payment Paid</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
            </select>

            <select className="text-xs px-3 py-1.5 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium focus:outline-none cursor-pointer">
              <option>All ERP References</option>
              <option>ERP-STOCKOUT-8812</option>
              <option>ERP-ISSUE-1102</option>
              <option>ERP-PAY-7701</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setCustomerFilter('ALL');
                setDirectionFilter('ALL');
                setParticularsFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs font-semibold text-[#0F5C5B] hover:underline flex items-center gap-1 cursor-pointer ml-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="px-3.5 py-1.5 rounded-xl bg-[#E8F5F3] hover:bg-[#D7EFEA] text-[#0F5C5B] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>View Live Balances</span>
          </button>
        </div>
      </div>

      {/* Transaction Ledger Table Section */}
      <div className="rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md overflow-hidden">
        {/* Table Header Controls */}
        <div className="px-6 py-4 border-b border-[#E2E8E6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TableProperties className="w-4 h-4 text-[#0F5C5B]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#143B39]">
                TRANSACTION LEDGER
              </h2>
            </div>
            <p className="text-[11px] text-[#647777] mt-0.5">
              Mathematical running balances calculated dynamically with strict directional sign conventions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-xl border border-[#DCE5E3] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#173333] flex items-center gap-1.5 cursor-pointer shadow-2xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#647777]" />
              <span>Columns</span>
            </button>

            <button className="px-3 py-1.5 rounded-xl border border-[#DCE5E3] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#173333] flex items-center gap-1.5 cursor-pointer shadow-2xs">
              <Download className="w-3.5 h-3.5 text-[#647777]" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-[#647777]" />
            </button>

            <button className="p-2 rounded-xl border border-[#DCE5E3] bg-white hover:bg-[#FAF9F6] text-[#647777] hover:text-[#173333] cursor-pointer shadow-2xs">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Ledger Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] whitespace-nowrap">
            <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[9.5px] tracking-wider">
              <tr>
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === displayTransactions.length}
                    onChange={handleSelectAll}
                    className="rounded border-[#DCE5E3] text-[#0F5C5B] focus:ring-[#0F5C5B]"
                  />
                </th>
                <th className="py-3 px-3">DATE</th>
                <th className="py-3 px-3">CUSTOMER</th>
                <th className="py-3 px-2">DIR</th>
                <th className="py-3 px-3">PARTICULARS</th>
                <th className="py-3 px-3">DESCRIPTION / ERP REF</th>
                <th className="py-3 px-2 text-center">NOS</th>
                <th className="py-3 px-3 text-right">GROSS WT (g)</th>
                <th className="py-3 px-2 text-right">STONE WT (g)</th>
                <th className="py-3 px-3 text-right">NET WT (g)</th>
                <th className="py-3 px-2 text-center">TOUCH (%)</th>
                <th className="py-3 px-3 text-right">PURE WT (g)</th>
                <th className="py-3 px-3 text-right">TOTAL MC (₹)</th>
                <th className="py-3 px-3 text-right">BAL WT (g)</th>
                <th className="py-3 px-3 text-right">BAL MC (₹)</th>
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-2 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {displayTransactions.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-[#647777]">
                    <BookOpen className="w-10 h-10 mx-auto text-[#647777]/40 mb-2" />
                    <p className="font-semibold text-sm">No ledger transactions found</p>
                    <p className="text-xs text-[#647777]/70 mt-1">
                      Click &quot;+ Record Transaction&quot; above to log your first transaction entry.
                    </p>
                  </td>
                </tr>
              ) : (
                displayTransactions.map((tx) => {
                  const isSelected = selectedIds.includes(tx.id);

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-[#FAF8F5] transition-colors ${
                        isSelected ? 'bg-[#FAF8F5]' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tx.id)}
                          className="rounded border-[#DCE5E3] text-[#0F5C5B] focus:ring-[#0F5C5B]"
                        />
                      </td>
                      <td className="py-3.5 px-3 font-mono font-medium text-[#173333]">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#173333]">{tx.customerName}</div>
                        <div className="text-[10px] text-[#647777] font-mono">{tx.customerCode}</div>
                      </td>
                      <td className="py-3.5 px-2">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold ${
                            tx.dir === 'ISSUE'
                              ? 'bg-[#E1F5F3] text-[#0F5C5B]'
                              : 'bg-[#FEECEC] text-[#C24141]'
                          }`}
                        >
                          {tx.dir === 'ISSUE' ? (
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          ) : (
                            <ArrowDownLeft className="w-2.5 h-2.5" />
                          )}
                          <span>{tx.dir}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-[#173333] text-[10px]">
                        {tx.particulars}
                      </td>
                      <td className="py-3.5 px-3 max-w-[200px] truncate">
                        <div className="font-medium text-[#173333] truncate">{tx.description}</div>
                        <div className="text-[9.5px] text-[#647777] font-mono truncate">
                          ERP: {tx.erpRef}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-center font-mono text-[#647777]">
                        {tx.nos !== null ? tx.nos : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-medium text-[#173333]">
                        {tx.grossWT.toFixed(3)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-[#647777]">
                        {tx.stoneWT.toFixed(3)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-medium">
                        <span className={tx.netWT < 0 ? 'text-[#C24141]' : 'text-[#173333]'}>
                          {tx.netWT.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center font-mono text-[#647777]">
                        {tx.touch !== null && tx.touch > 0 ? `${tx.touch.toFixed(2)}%` : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold">
                        <span className={tx.pureWT < 0 ? 'text-[#C24141]' : tx.pureWT > 0 ? 'text-[#1B7C5A]' : 'text-[#647777]'}>
                          {tx.pureWT.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-semibold">
                        <span className={tx.totalMC < 0 ? 'text-[#C24141]' : tx.totalMC > 0 ? 'text-[#1B7C5A]' : 'text-[#647777]'}>
                          {tx.totalMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-[#173333]">
                        <span className={tx.balWT < 0 ? 'text-[#C24141]' : 'text-[#173333]'}>
                          {tx.balWT.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-[#173333]">
                        ₹ {tx.balMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E6F8F2] text-[#1A825B]">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-center text-[#647777]">
                        <button className="p-1 hover:text-[#173333] cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="px-6 py-4 border-t border-[#E2E8E6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#647777]">
          <div>
            Showing <span className="font-bold text-[#173333]">{displayTransactions.length > 0 ? 1 : 0}</span> to{' '}
            <span className="font-bold text-[#173333]">{displayTransactions.length}</span> of{' '}
            <span className="font-bold text-[#173333]">{displayTransactions.length}</span> transactions
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-[#DCE5E3] hover:bg-white cursor-pointer">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg border border-[#DCE5E3] hover:bg-white cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#0F5C5B] text-white font-bold text-xs">
              1
            </button>
            <button className="p-1.5 rounded-lg border border-[#DCE5E3] hover:bg-white cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


