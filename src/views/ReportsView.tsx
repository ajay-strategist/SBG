import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  FileBarChart2,
  Printer,
  Download,
  Calendar,
  Users,
  ShoppingBag,
  BookOpen,
  FileSpreadsheet,
  Coins,
  Gem,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface ReportsViewProps {
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigate }) => {
  const { customers, orders, transactions, estimates, settlements } = useSBG();

  const [reportType, setReportType] = useState<
    'CUSTOMER_BALANCES' | 'CUSTOMER_LEDGER' | 'ORDER_COMMERCIAL' | 'ESTIMATE_REGISTER' | 'SETTLEMENT_REGISTER'
  >('CUSTOMER_BALANCES');

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (reportType === 'CUSTOMER_BALANCES') {
      csvContent += 'Customer Code,Customer Name,Phone,City,Opening Pure WT (g),Opening MC (INR),Current Pure WT (g),Current MC (INR),Status\n';
      customers.forEach((c) => {
        csvContent += `"${c.code}","${c.name}","${c.phone}","${c.city || ''}",${c.openingWT},${c.openingMC},${c.currentWT},${c.currentMC},"${c.status}"\n`;
      });
    } else if (reportType === 'CUSTOMER_LEDGER') {
      csvContent += 'Date,Customer,Direction,Particulars,Description,Gross WT,Stone WT,Net WT,Touch %,Pure WT,Total MC,Status\n';
      transactions.forEach((t) => {
        const c = customers.find((cust) => cust.id === t.customerId);
        csvContent += `"${t.date}","${c?.name || ''}","${t.direction}","${t.particulars}","${t.description}",${t.grossWT},${t.stoneWT},${t.netWT},${t.touch},${t.pureWT},${t.totalAmount},"${t.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SBG_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Luxury Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/90 via-white/80 to-[#F5ECE0]/80 p-6 sm:p-8 border border-white/80 shadow-sm overflow-hidden backdrop-blur-md">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0F5C5B]/10 border border-[#0F5C5B]/20 flex items-center justify-center shrink-0">
              <FileBarChart2 className="w-6 h-6 text-[#0F5C5B]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#143B39] tracking-tight">
                Commercial & Financial Reports
              </h1>
              <p className="text-xs text-[#526B6A] mt-1 font-medium">
                Exportable audit registers, balance statements, and date-wise commercial summaries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 no-print">
            <button
              onClick={exportCSV}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FAF9F6] border border-[#DCE5E3] text-[#173333] font-semibold text-xs shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4 text-[#647777]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-2xl bg-[#0F5C5B] hover:bg-[#0A4847] text-white font-semibold text-xs shadow-md shadow-[#0F5C5B]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
        {[
          { id: 'CUSTOMER_BALANCES', label: 'Customer Balance Statement', icon: Users },
          { id: 'CUSTOMER_LEDGER', label: 'Ledger Register', icon: BookOpen },
          { id: 'ORDER_COMMERCIAL', label: 'Order Summary Register', icon: ShoppingBag },
          { id: 'ESTIMATE_REGISTER', label: 'Estimate & Cost Register', icon: FileSpreadsheet },
          { id: 'SETTLEMENT_REGISTER', label: 'Settlement Register', icon: Coins },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#0F5C5B] text-white shadow-md'
                  : 'bg-white/80 text-[#647777] hover:text-[#173333] border border-[#DCE5E3]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date & Customer Filters */}
      <div className="p-3.5 rounded-2xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#647777] font-semibold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#FAF9F6] border border-[#DCE5E3] rounded-xl px-2.5 py-1.5 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#647777] font-semibold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#FAF9F6] border border-[#DCE5E3] rounded-xl px-2.5 py-1.5 font-mono"
            />
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="bg-[#FAF9F6] border border-[#DCE5E3] rounded-xl px-3 py-1.5 text-xs"
          >
            <option value="ALL">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-[#647777] font-mono">
          As of: {new Date().toLocaleDateString('en-IN')}
        </span>
      </div>

      {/* Report Content Table */}
      <div className="rounded-3xl bg-white/95 border border-[#E2E8E6] p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Printable Report Header */}
        <div className="flex justify-between items-center border-b border-[#E2E8E6] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img src="/sbg-logo.png" alt="Sree Balaji Gold" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F5C5B]">SREE BALAJI GOLD — COMMERCIAL STATEMENT</h3>
              <p className="text-xs text-[#647777] mt-0.5">
                Report: <strong>{reportType.replace('_', ' ')}</strong> | Period: {startDate} to {endDate}
              </p>
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="font-bold text-[#173333]">SREE BALAJI GOLD ERP</div>
            <div className="text-[#647777] text-[10px]">CONFIDENTIAL FINANCIAL REPORT</div>
          </div>
        </div>

        {/* 1. Customer Balance Statement */}
        {reportType === 'CUSTOMER_BALANCES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Customer Account</th>
                  <th className="py-3 px-3">City</th>
                  <th className="py-3 px-3 text-right">Opening Pure WT</th>
                  <th className="py-3 px-3 text-right">Opening MC (₹)</th>
                  <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">Current Pure WT</th>
                  <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">Current MC Balance</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-3 font-mono font-bold text-[#0F5C5B]">{c.code}</td>
                    <td className="py-3 px-3 font-semibold text-[#173333]">{c.name}</td>
                    <td className="py-3 px-3 text-[#647777]">{c.city || 'Mumbai'}</td>
                    <td className="py-3 px-3 text-right font-mono">{c.openingWT.toFixed(3)} g</td>
                    <td className="py-3 px-3 text-right font-mono">₹ {c.openingMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={c.currentWT < 0 ? 'text-[#C24141]' : 'text-[#1B7C5A]'}>
                        {c.currentWT.toFixed(3)} g
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#173333]">
                      ₹ {c.currentMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-bold ${c.status === 'ACTIVE' ? 'bg-[#E6F8F2] text-[#1A825B]' : 'bg-[#FEECEC] text-[#C24141]'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Customer Ledger */}
        {reportType === 'CUSTOMER_LEDGER' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Dir</th>
                  <th className="py-3 px-3">Particulars</th>
                  <th className="py-3 px-3 text-right">Gross WT</th>
                  <th className="py-3 px-3 text-right">Net WT</th>
                  <th className="py-3 px-3 text-right">Touch</th>
                  <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">Pure WT</th>
                  <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">Total Amount</th>
                  <th className="py-3 px-3 text-right font-bold">Balance WT</th>
                  <th className="py-3 px-3 text-right font-bold">Balance MC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {transactions.map((t) => {
                  const cust = customers.find((c) => c.id === t.customerId);
                  return (
                    <tr key={t.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-3 font-mono">{t.date}</td>
                      <td className="py-3 px-3 font-semibold">{cust?.name}</td>
                      <td className="py-3 px-3 font-bold text-[10px]">{t.direction}</td>
                      <td className="py-3 px-3">{t.particulars}</td>
                      <td className="py-3 px-3 text-right font-mono">{t.grossWT.toFixed(3)}</td>
                      <td className="py-3 px-3 text-right font-mono">{t.netWT.toFixed(3)}</td>
                      <td className="py-3 px-3 text-right font-mono">{t.touch.toFixed(2)}%</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#0F5C5B]">
                        {t.pureWT.toFixed(3)} g
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        ₹ {t.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold bg-[#0F5C5B]/5">
                        {t.balanceWT.toFixed(3)} g
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold bg-[#0F5C5B]/5">
                        ₹ {t.balanceMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Order Summary */}
        {reportType === 'ORDER_COMMERCIAL' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-3">Order No.</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Reference / ERP</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Target Gross WT</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {orders.map((o) => {
                  const cust = customers.find((c) => c.id === o.customerId);
                  return (
                    <tr key={o.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-3 font-mono font-bold text-[#0F5C5B]">{o.orderNo}</td>
                      <td className="py-3 px-3 font-semibold">{cust?.name}</td>
                      <td className="py-3 px-3 font-mono text-[#647777]">{o.orderDate}</td>
                      <td className="py-3 px-3 font-mono">{o.reference} {o.erpRef && `(${o.erpRef})`}</td>
                      <td className="py-3 px-3 text-[#647777]">{o.itemDescription}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{o.targetGrossWT?.toFixed(3) || '-'} g</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-bold ${o.status === 'SETTLED' ? 'bg-[#E6F8F2] text-[#1A825B]' : 'bg-[#FEF5E6] text-[#B87B1D]'}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Estimate Register */}
        {reportType === 'ESTIMATE_REGISTER' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-3">Estimate No.</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Pure WT</th>
                  <th className="py-3 px-3 text-right">Gold Value</th>
                  <th className="py-3 px-3 text-right">Taxable</th>
                  <th className="py-3 px-3 text-right">GST (3%)</th>
                  <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">Grand Total</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {estimates.map((e) => {
                  const cust = customers.find((c) => c.id === e.customerId);
                  return (
                    <tr key={e.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-3 font-mono font-bold text-[#0F5C5B]">{e.estimateNo}</td>
                      <td className="py-3 px-3 font-semibold">{cust?.name || e.customerName}</td>
                      <td className="py-3 px-3 font-mono">{e.estimateDate}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#0F5C5B]">{e.totals.totalPureWT.toFixed(3)} g</td>
                      <td className="py-3 px-3 text-right font-mono">₹ {e.totals.goldValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono">₹ {e.totals.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono text-[#647777]">₹ {e.totals.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-sm text-[#0F5C5B]">₹ {e.totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-bold ${e.status === 'CONFIRMED' ? 'bg-[#E6F8F2] text-[#1A825B]' : 'bg-[#FEF5E6] text-[#B87B1D]'}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Settlement Register */}
        {reportType === 'SETTLEMENT_REGISTER' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-3">Settlement No.</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Gold Received</th>
                  <th className="py-3 px-3 text-right">Cash Received</th>
                  <th className="py-3 px-3 text-right">Agreed Rate</th>
                  <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">New Pure WT</th>
                  <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">New MC Bal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {settlements.map((s) => {
                  const cust = customers.find((c) => c.id === s.customerId);
                  return (
                    <tr key={s.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-3 font-mono font-bold text-[#0F5C5B]">{s.settlementNo}</td>
                      <td className="py-3 px-3 font-mono">{s.date}</td>
                      <td className="py-3 px-3 font-semibold">{cust?.name}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#FBF4E4] text-[#966E1D]">
                          {s.settlementType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#0F5C5B]">{s.goldReceived.toFixed(3)} g</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">₹ {s.cashReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono">₹ {s.agreedGoldRate.toLocaleString('en-IN')}/g</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{s.newBalanceWT.toFixed(3)} g</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">₹ {s.newBalanceMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
