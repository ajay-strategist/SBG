import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  Users,
  ShoppingBag,
  TrendingUp,
  FileSpreadsheet,
  ChevronRight,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  PieChart,
  FileText,
  Repeat,
  MoreHorizontal,
  Scale,
  Coins,
  Gem,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { customers, orders, transactions, estimates, settlements, goldMarketRate } = useSBG();
  const [selectedRange, setSelectedRange] = useState('Last 6 Months');

  // Dynamic live calculations from store
  const activeCustomersCount = customers.filter((c) => c.status === 'ACTIVE').length;
  const openOrdersCount = orders.filter(
    (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'SETTLED'
  ).length;
  const totalPureWT = customers.reduce((sum, c) => sum + (c.currentWT || 0), 0);
  const totalMCBalance = customers.reduce((sum, c) => sum + (c.currentMC || 0), 0);
  const goldValueINR = totalPureWT * goldMarketRate;
  const totalEquityINR = goldValueINR + totalMCBalance;

  const goldPercent = totalEquityINR > 0 ? Math.round((Math.max(0, goldValueINR) / totalEquityINR) * 100) : 0;
  const mcPercent = totalEquityINR > 0 ? Math.round((Math.max(0, totalMCBalance) / totalEquityINR) * 100) : 0;
  const otherPercent = totalEquityINR > 0 ? Math.max(0, 100 - goldPercent - mcPercent) : 0;

  // Recent customer ledger rows from live transactions
  const ledgerRows = transactions.slice(0, 5).map((tx) => {
    const cust = customers.find((c) => c.id === tx.customerId);
    return {
      id: tx.id,
      date: tx.date,
      ref: tx.erpRef || 'TRN-' + tx.id.slice(-4),
      customer: cust?.name || 'Customer Account',
      dir: tx.direction,
      type: tx.particulars,
      grossWT: tx.grossWT || 0,
      pureWT: tx.pureWT || 0,
      amount: tx.totalAmount || tx.mcAmount || 0,
      status: tx.status || 'CONFIRMED',
    };
  });

  // Recent Estimates from store
  const activeEstimatesList = estimates.slice(0, 3).map((est) => {
    const cust = customers.find((c) => c.id === est.customerId);
    return {
      id: est.id,
      estimateNo: est.estimateNo,
      customer: cust?.name || est.customerName || 'Customer',
      date: est.estimateDate,
      status: est.status || 'DRAFT',
      amount: est.totals?.grandTotal || 0,
    };
  });

  // Recent Settlements from store
  const recentSettlementsList = settlements.slice(0, 3).map((stl) => {
    const cust = customers.find((c) => c.id === stl.customerId);
    return {
      id: stl.id,
      settlementNo: stl.settlementNo,
      customer: cust?.name || stl.customerName || 'Customer',
      date: stl.date,
      type: stl.settlementType.replace(/_/g, ' '),
      amount: (stl.cashReceived || 0) + ((stl.goldReceived || 0) * (stl.agreedGoldRate || goldMarketRate)),
    };
  });

  return (
    <div className="space-y-6">
      {/* Executive Commercial Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/90 via-white/80 to-[#F5ECE0]/80 p-6 sm:p-8 border border-white/80 shadow-sm overflow-hidden backdrop-blur-md">
        {/* Background luxury silk ribbon and diamond ring artwork */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-40 overflow-hidden hidden md:block">
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 600 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 20 C250 180, 450 10, 600 120"
              stroke="url(#bannerGold)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <path
              d="M0 120 C180 30, 380 190, 580 60"
              stroke="url(#bannerGold2)"
              strokeWidth="2"
            />
            <circle cx="480" cy="90" r="55" stroke="#D9B76C" strokeWidth="1" strokeDasharray="3 3" />
            <defs>
              <linearGradient id="bannerGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D9B76C" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#C49E4B" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="bannerGold2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F4E8C8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#D9B76C" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Title & Welcome */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#9A783A] block mb-1">
              WELCOME BACK, RAJESH
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#143B39] tracking-tight">
              Commercial Dashboard
            </h1>
            <p className="text-xs text-[#526B6A] mt-1 font-medium">
              Real-time Jewellery Ledger, Order Tracking & Business Insights
            </p>
          </div>

          {/* Slogan & Date Card */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Slogan */}
            <div className="text-left sm:text-right border-l-2 sm:border-l-0 sm:border-r-2 border-[#D9B76C]/40 pl-3 sm:pl-0 sm:pr-4">
              <span className="text-xs text-[#526B6A] block font-medium">Precise Records</span>
              <span className="text-xs text-[#526B6A] block font-medium">Stronger Relationships</span>
              <span className="text-xs font-bold text-[#C69234] block">Brighter Tomorrow</span>
            </div>

            {/* Date & Time Badge */}
            <div className="px-4 py-2.5 rounded-2xl bg-white/90 border border-[#DCE5E3] shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0F5C5B]/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#0F5C5B]" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#173333]">
                  Monday, 22 September 2026
                </div>
                <div className="text-[11px] text-[#647777] font-medium">
                  10:24 AM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: 4 Key Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ACTIVE CUSTOMERS */}
        <div
          onClick={() => onNavigate('customers')}
          className="p-5 rounded-2xl bg-[#F2FAF8] border border-[#D5EAE5] shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#4B6B68] uppercase tracking-wider">
              ACTIVE CUSTOMERS
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E2F3F0] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#0F5C5B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              {activeCustomersCount}
            </span>
            <div className="flex items-center gap-1 text-xs text-[#2E8B57] font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{customers.length} registered accounts</span>
            </div>
          </div>
        </div>

        {/* Card 2: OPEN COMMERCIAL ORDERS */}
        <div
          onClick={() => onNavigate('orders')}
          className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
              OPEN COMMERCIAL ORDERS
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FDF3DE] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#C48C2B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              {openOrdersCount}
            </span>
            <div className="text-xs text-[#7A6D56] font-medium mt-1">
              <span className="font-bold">{orders.length}</span> total lifetime orders
            </div>
          </div>
        </div>

        {/* Card 3: NET PURE GOLD OUTSTANDING (Signature Emerald Card) */}
        <div
          onClick={() => onNavigate('ledger')}
          className="p-5 rounded-2xl bg-gradient-to-br from-[#0D5251] to-[#073635] text-white border border-[#D9B76C]/40 shadow-lg ring-1 ring-[#D9B76C]/20 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#E7CCA0] uppercase tracking-wider">
              NET PURE GOLD OUTSTANDING
            </span>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#D9B76C]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white tracking-tight">
                {totalPureWT.toFixed(3)}
              </span>
              <span className="text-xl font-normal text-white/80">g</span>
            </div>
            <div className="text-xs text-[#E9D7A5] font-medium mt-1">
              ₹ {(goldValueINR / 100000).toFixed(2)} Lakhs eq.
            </div>
          </div>
        </div>

        {/* Card 4: NET MC BALANCE OUTSTANDING */}
        <div
          onClick={() => onNavigate('ledger')}
          className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
              NET MC BALANCE OUTSTANDING
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FDF3DE] flex items-center justify-center">
              <Coins className="w-4 h-4 text-[#C48C2B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-[26px] font-bold text-[#133837] tracking-tight block">
              ₹ {totalMCBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <div className="text-xs text-[#7A6D56] font-medium mt-1">
              Accumulated making charges
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Balance Trend & Portfolio Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart (8 of 12 cols): BALANCE TREND (LAST 6 MONTHS) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#0F5C5B]/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-[#0F5C5B]" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#143B39]">
                BALANCE TREND (LAST 6 MONTHS)
              </h3>
            </div>

            {/* Legend & Filter */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 text-[#0F5C5B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F5C5B] inline-block" /> Pure Gold (g)
                </span>
                <span className="flex items-center gap-1.5 text-[#C48C2B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C48C2B] inline-block" /> MC Amount (₹ Lakhs)
                </span>
              </div>

              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#DCE5E3] bg-white text-[#173333] font-medium focus:outline-none cursor-pointer"
              >
                <option>Last 6 Months</option>
                <option>Last 3 Months</option>
                <option>Year to Date</option>
              </select>
            </div>
          </div>

          {/* Interactive Dual-Axis Bézier Curve SVG Chart */}
          <div className="relative w-full h-64 pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 640 220">
              {/* Grids */}
              <line x1="40" y1="30" x2="600" y2="30" stroke="#EEF2F1" strokeDasharray="3 3" />
              <line x1="40" y1="75" x2="600" y2="75" stroke="#EEF2F1" strokeDasharray="3 3" />
              <line x1="40" y1="120" x2="600" y2="120" stroke="#EEF2F1" strokeDasharray="3 3" />
              <line x1="40" y1="165" x2="600" y2="165" stroke="#EEF2F1" strokeDasharray="3 3" />

              {/* Left Y Axis Labels (Gold grams) */}
              <text x="10" y="35" className="text-[10px] fill-[#7E9694] font-mono">200</text>
              <text x="10" y="80" className="text-[10px] fill-[#7E9694] font-mono">150</text>
              <text x="10" y="125" className="text-[10px] fill-[#7E9694] font-mono">100</text>
              <text x="15" y="170" className="text-[10px] fill-[#7E9694] font-mono">50</text>
              <text x="20" y="200" className="text-[10px] fill-[#7E9694] font-mono">0</text>

              {/* Right Y Axis Labels (MC ₹ Lakhs) */}
              <text x="610" y="35" className="text-[10px] fill-[#7E9694] font-mono">4.0</text>
              <text x="610" y="80" className="text-[10px] fill-[#7E9694] font-mono">3.0</text>
              <text x="610" y="120" className="text-[10px] fill-[#7E9694] font-mono">2.0</text>
              <text x="610" y="160" className="text-[10px] fill-[#7E9694] font-mono">1.0</text>
              <text x="610" y="200" className="text-[10px] fill-[#7E9694] font-mono">0.0</text>

              {/* Shaded Area Fills */}
              <defs>
                <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F5C5B" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0F5C5B" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="mcAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D9B76C" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#D9B76C" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Pure Gold & MC Trend Curves */}
              {transactions.length === 0 ? (
                <g>
                  {/* Baseline Flat Curves for Fresh DB */}
                  <line x1="50" y1="195" x2="590" y2="195" stroke="#0F5C5B" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="50" y1="198" x2="590" y2="198" stroke="#D4A347" strokeWidth="2" strokeDasharray="4 4" />
                  <text x="240" y="110" className="text-xs fill-[#7E9694] font-sans">
                    Awaiting transactions to plot trend
                  </text>
                </g>
              ) : (
                <g>
                  <path
                    d="M 50 160 C 130 140, 170 100, 250 85 C 330 80, 370 130, 450 120 C 510 110, 550 75, 590 65 L 590 200 L 50 200 Z"
                    fill="url(#goldAreaGrad)"
                  />
                  <path
                    d="M 50 160 C 130 140, 170 100, 250 85 C 330 80, 370 130, 450 120 C 510 110, 550 75, 590 65"
                    fill="none"
                    stroke="#0F5C5B"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M 50 180 C 130 160, 170 130, 250 120 C 330 120, 370 160, 450 155 C 510 150, 550 110, 590 90 L 590 200 L 50 200 Z"
                    fill="url(#mcAreaGrad)"
                  />
                  <path
                    d="M 50 180 C 130 160, 170 130, 250 120 C 330 120, 370 160, 450 155 C 510 150, 550 110, 590 90"
                    fill="none"
                    stroke="#D4A347"
                    strokeWidth="2.5"
                  />
                  <circle cx="590" cy="65" r="4" fill="#0F5C5B" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="590" cy="90" r="4" fill="#D4A347" stroke="#FFFFFF" strokeWidth="2" />
                </g>
              )}

              {/* Month Labels X Axis */}
              <text x="35" y="215" className="text-[11px] fill-[#647777] font-medium">Apr 2026</text>
              <text x="135" y="215" className="text-[11px] fill-[#647777] font-medium">May 2026</text>
              <text x="240" y="215" className="text-[11px] fill-[#647777] font-medium">Jun 2026</text>
              <text x="355" y="215" className="text-[11px] fill-[#647777] font-medium">Jul 2026</text>
              <text x="465" y="215" className="text-[11px] fill-[#647777] font-medium">Aug 2026</text>
              <text x="565" y="215" className="text-[11px] fill-[#647777] font-medium">Sep 2026</text>
            </svg>
          </div>
        </div>

        {/* Right Chart (4 of 12 cols): LEDGER PORTFOLIO BREAKDOWN */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#C48C2B]/10 flex items-center justify-center">
                <PieChart className="w-3.5 h-3.5 text-[#C48C2B]" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#143B39]">
                LEDGER PORTFOLIO BREAKDOWN
              </h3>
            </div>
            <Scale className="w-4 h-4 text-[#647777]" />
          </div>

          {/* Donut Chart & Side Legend */}
          <div className="flex items-center justify-between gap-4 my-auto pt-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#E8EFEF"
                  strokeWidth="15"
                />
                {totalEquityINR > 0 && (
                  <>
                    {/* Making Charge (Gold) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#D4A347"
                      strokeWidth="15"
                      strokeDasharray={`${(mcPercent / 100) * 238.76} 238.76`}
                      strokeDashoffset="0"
                    />
                    {/* Pure Gold (Teal) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#0F5C5B"
                      strokeWidth="15"
                      strokeDasharray={`${(goldPercent / 100) * 238.76} 238.76`}
                      strokeDashoffset={`-${(mcPercent / 100) * 238.76}`}
                    />
                  </>
                )}
              </svg>
              {/* Donut Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-[#647777] font-medium block">Total</span>
                <span className="text-xs font-bold text-[#143B39] font-mono leading-tight">
                  ₹ {(totalEquityINR / 100000).toFixed(2)}L
                </span>
                <span className="text-[9px] text-[#647777]">eq.</span>
              </div>
            </div>

            {/* Right Legend */}
            <div className="space-y-3 text-left">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#143B39]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F5C5B] shrink-0" />
                  <span>Pure Gold</span>
                </div>
                <div className="text-[11px] text-[#647777] pl-4 font-mono">
                  {totalPureWT.toFixed(3)} g <span className="font-semibold text-[#0F5C5B]">({goldPercent}%)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#143B39]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4A347] shrink-0" />
                  <span>Making Charge</span>
                </div>
                <div className="text-[11px] text-[#647777] pl-4 font-mono">
                  ₹ {(totalMCBalance / 100000).toFixed(2)}L <span className="font-semibold text-[#C48C2B]">({mcPercent}%)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#143B39]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8FA5A3] shrink-0" />
                  <span>Other Adjustments</span>
                </div>
                <div className="text-[11px] text-[#647777] pl-4 font-mono">
                  ₹ 0.00L <span className="font-semibold text-[#647777]">({otherPercent}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Operational Data (Recent Movements & Estimates/Settlements) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (8 of 12 cols): RECENT CUSTOMER LEDGER MOVEMENTS */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0F5C5B]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#143B39]">
                RECENT CUSTOMER LEDGER MOVEMENTS
              </h3>
            </div>
            <button
              onClick={() => onNavigate('ledger')}
              className="text-xs font-bold text-[#0F5C5B] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">DATE / REF</th>
                  <th className="py-2.5 px-3">CUSTOMER</th>
                  <th className="py-2.5 px-3">DIRECTION & TYPE</th>
                  <th className="py-2.5 px-3 text-right">GROSS WT (g)</th>
                  <th className="py-2.5 px-3 text-right">PURE WT (g)</th>
                  <th className="py-2.5 px-3 text-right">AMOUNT (₹)</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                  <th className="py-2.5 px-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F3]">
                {ledgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#647777]">
                      <Clock className="w-7 h-7 mx-auto text-[#647777]/40 mb-1.5" />
                      <p className="font-semibold text-xs">No recent ledger movements</p>
                      <p className="text-[11px] text-[#647777]/70 mt-0.5">
                        Transactions recorded in the ledger will appear here automatically.
                      </p>
                    </td>
                  </tr>
                ) : (
                  ledgerRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-[#173333]">{row.date}</div>
                        <div className="text-[10px] text-[#647777]">{row.ref}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#173333]">
                        {row.customer}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            row.dir === 'ISSUE'
                              ? 'bg-[#E1F5F3] text-[#0F5C5B]'
                              : 'bg-[#FEECEC] text-[#C24141]'
                          }`}
                        >
                          {row.dir === 'ISSUE' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          <span className="uppercase">{row.dir}</span>
                          <span className="font-normal opacity-80">{row.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-[#173333]">
                        {row.grossWT.toFixed(3)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={row.pureWT < 0 ? 'text-[#C24141]' : 'text-[#173333]'}>
                          {row.pureWT.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-[#173333]">
                        ₹ {row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E6F8F2] text-[#1A825B] tracking-wider">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-[#647777]">
                        <button className="p-1 hover:text-[#173333] cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (4 of 12 cols): ACTIVE ESTIMATES & RECENT SETTLEMENTS */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Estimates Card */}
          <div className="p-5 rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#C48C2B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#143B39]">
                  ACTIVE ESTIMATES
                </h3>
              </div>
              <button
                onClick={() => onNavigate('estimates')}
                className="text-xs font-bold text-[#0F5C5B] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {activeEstimatesList.length === 0 ? (
                <div className="py-6 text-center text-[#647777]">
                  <FileSpreadsheet className="w-6 h-6 mx-auto text-[#647777]/40 mb-1" />
                  <p className="text-xs font-medium">No active estimates</p>
                </div>
              ) : (
                activeEstimatesList.map((est) => (
                  <div
                    key={est.id}
                    onClick={() => onNavigate('estimate-details', est.id)}
                    className="p-3 rounded-2xl bg-[#FAF9F6] hover:bg-[#F5F2EB] border border-[#EFECE6] transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-[#DCE5E3] flex items-center justify-center">
                        <FileText className="w-4 h-4 text-[#0F5C5B]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#173333]">
                            {est.estimateNo}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              est.status === 'CONFIRMED' || est.status === 'FINALIZED'
                                ? 'bg-[#E6F8F2] text-[#1A825B]'
                                : est.status === 'PENDING'
                                ? 'bg-[#FEF5E6] text-[#B87B1D]'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {est.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#647777] font-medium">
                          {est.customer}
                        </div>
                        <div className="text-[10px] text-[#8C9E9D]">{est.date}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-xs text-[#173333]">
                      ₹ {est.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Settlements Card */}
          <div className="p-5 rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#C48C2B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#143B39]">
                  RECENT SETTLEMENTS
                </h3>
              </div>
              <button
                onClick={() => onNavigate('settlements')}
                className="text-xs font-bold text-[#0F5C5B] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentSettlementsList.length === 0 ? (
                <div className="py-6 text-center text-[#647777]">
                  <Repeat className="w-6 h-6 mx-auto text-[#647777]/40 mb-1" />
                  <p className="text-xs font-medium">No recent settlements</p>
                </div>
              ) : (
                recentSettlementsList.map((stl) => (
                  <div
                    key={stl.id}
                    onClick={() => onNavigate('settlements')}
                    className="p-3 rounded-2xl bg-[#FAF9F6] hover:bg-[#F5F2EB] border border-[#EFECE6] transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-[#DCE5E3] flex items-center justify-center">
                        <Repeat className="w-4 h-4 text-[#0F5C5B]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#173333]">
                            {stl.settlementNo}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FBF4E4] text-[#966E1D]">
                            {stl.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#647777] font-medium">
                          {stl.customer}
                        </div>
                        <div className="text-[10px] text-[#8C9E9D]">{stl.date}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-xs text-[#173333]">
                      ₹ {stl.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

