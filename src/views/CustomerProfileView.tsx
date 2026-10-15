import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  SBGCard,
  SBGButton,
  SBGBadge,
  SBGCurrency,
  SBGWeight,
  SBGBalanceCard,
  TransactionModal,
  GoogleSheetImportModal,
} from '../components/ui';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Coins,
  PlusCircle,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Trash2,
  Palette,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Eye,
  Banknote,
  Receipt,
  Scale,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface CustomerProfileViewProps {
  customerId: string;
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

interface CashLedgerRow {
  id: string;
  date: string;
  type: 'ISSUE' | 'RECEIPT';
  particulars: 'SALE' | 'PURCHASE' | 'PAYMENT_RECEIVED' | 'PAYMENT_PAID';
  customerJobRef: string;
  estimateNo: string;
  estimateId?: string;
  amount: number;
  delta: number;
  balance: number;
  rawTime: number;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  customerId,
  onNavigate,
}) => {
  const {
    customers,
    estimates,
    getCustomerTransactions,
    deleteTransaction,
    currentUser,
  } = useSBG();

  const [activeProfileTab, setActiveProfileTab] = useState<'gc_account' | 'ledger' | 'estimates'>('gc_account');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [useSheetTheme, setUseSheetTheme] = useState(true);

  const isClient = currentUser?.role === 'CLIENT';
  const effectiveCustomerId = isClient ? (currentUser?.customerId || 'cust-101') : customerId;
  const customer = customers.find((c) => c.id === effectiveCustomerId) || customers[0];

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white/80 rounded-3xl border border-[#E2E8E6] shadow-xs my-6">
        <p className="text-sm text-[#647777] font-medium">Customer account not found or no customer selected.</p>
        <SBGButton variant="outline" className="mt-4" onClick={() => onNavigate('customers')}>
          Return to Customers
        </SBGButton>
      </div>
    );
  }

  // 1. GC Account Transactions (Gold & Cash dual balance)
  const customerLedger = getCustomerTransactions(customer.id);

  // 2. Estimates for this customer
  const customerEstimates = (estimates || [])
    .filter((e) => e.customerId === customer.id)
    .sort((a, b) => new Date(b.estimateDate).getTime() - new Date(a.estimateDate).getTime() || b.estimateNo.localeCompare(a.estimateNo));

  // 3. Cash-Only Ledger Calculations (Single point of commercial entry)
  const openingBalance = customer.openingLedgerMC ?? customer.openingMC ?? 0;

  // A. Confirmed Estimates posting full bill amount
  const estimateCashEvents = (estimates || [])
    .filter((est) => est.customerId === customer.id && est.status === 'CONFIRMED')
    .map((est) => {
      const isPurchase = est.transactionType === 'PURCHASE' || est.direction === 'RECEIPT';
      const amount = Number(est.totals.grandTotal) || 0;
      const type: 'ISSUE' | 'RECEIPT' = isPurchase ? 'RECEIPT' : 'ISSUE';
      const particulars: 'SALE' | 'PURCHASE' = isPurchase ? 'PURCHASE' : 'SALE';
      const delta = isPurchase ? -amount : amount;

      return {
        id: `est-${est.id}`,
        date: est.estimateDate,
        type,
        particulars,
        customerJobRef: est.customerRef || est.orderRef || '-',
        estimateNo: est.estimateNo,
        estimateId: est.id,
        amount,
        delta,
        rawTime: new Date(est.estimateDate).getTime() || 0,
      };
    });

  // B. Payment / Voucher events from transactions
  const paymentCashEvents = customerLedger
    .filter((tx) => !tx.estimateId && tx.particulars !== 'OPENING_BALANCE')
    .map((tx) => {
      const isReceipt = tx.direction === 'RECEIPT';
      const goldAmt = tx.goldAmount || 0;
      const cashAmt = tx.cashAmount || tx.mcAmount || 0;
      const totalCashVal = tx.totalAmount !== 0 ? Math.abs(tx.totalAmount) : (goldAmt + cashAmt);

      const type: 'ISSUE' | 'RECEIPT' = isReceipt ? 'RECEIPT' : 'ISSUE';
      const particulars: 'PAYMENT_RECEIVED' | 'PAYMENT_PAID' = isReceipt ? 'PAYMENT_RECEIVED' : 'PAYMENT_PAID';
      const delta = isReceipt ? -totalCashVal : totalCashVal;

      return {
        id: tx.id,
        date: tx.date,
        type,
        particulars,
        customerJobRef: tx.erpRef || tx.description || '-',
        estimateNo: '-',
        estimateId: undefined,
        amount: totalCashVal,
        delta,
        rawTime: new Date(tx.date).getTime() || 0,
      };
    });

  // Merge & Sort Chronologically
  const allCashEvents = [...estimateCashEvents, ...paymentCashEvents].sort((a, b) => {
    if (a.date !== b.date) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return a.rawTime - b.rawTime;
  });

  // Compute running balance
  let runningCash = openingBalance;
  let totalCashIssues = 0;
  let totalCashReceipts = 0;

  const cashLedgerRows: CashLedgerRow[] = allCashEvents.map((item) => {
    if (item.type === 'ISSUE') {
      totalCashIssues += item.amount;
    } else {
      totalCashReceipts += item.amount;
    }
    runningCash = Number((runningCash + item.delta).toFixed(2));
    return {
      ...item,
      balance: runningCash,
    };
  });

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCashLedger = () => {
    const headers = [
      'Date',
      'Type',
      'Particulars',
      'Customer Job Reference',
      'Estimate Number',
      'Amount (INR)',
      'Running Balance (INR)',
    ];

    const rows = [
      [
        '-',
        'OPEN',
        'OPENING',
        'Opening Account Balance',
        '-',
        openingBalance,
        openingBalance,
      ],
      ...cashLedgerRows.map((row) => [
        row.date,
        row.type,
        row.particulars,
        `"${(row.customerJobRef || '').replace(/"/g, '""')}"`,
        row.estimateNo,
        row.amount,
        row.balance,
      ]),
    ];

    downloadCSV(
      `${customer.name.replace(/\s+/g, '_')}_Cash_Ledger.csv`,
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    );
  };

  const exportGCAccount = () => {
    const headers = [
      'Date',
      'Issue/Receipt',
      'Particulars',
      'Description',
      'Nos',
      'Gross WT',
      'Stone WT',
      'Net WT',
      'Touch',
      'Pure WT',
      'Stone Amount',
      'MC Amount',
      'Total Amount',
      'Balance MC',
      'Balance WT',
    ];

    const rows = customerLedger.map((tx) => [
      tx.date,
      tx.direction,
      tx.particulars,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      tx.nos || '',
      tx.grossWT !== 0 ? (tx.direction === 'RECEIPT' ? -Math.abs(tx.grossWT) : tx.grossWT) : 0,
      tx.stoneWT || 0,
      tx.netWT,
      `${tx.touch}%`,
      tx.pureWT,
      tx.stoneAmountCal || 0,
      tx.mcAmount || 0,
      tx.totalAmount || 0,
      tx.balanceMC || 0,
      tx.balanceWT,
    ]);

    downloadCSV(
      `${customer.name.replace(/\s+/g, '_')}_GC_Account.csv`,
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    );
  };

  const exportEstimates = () => {
    const headers = ['Estimate No', 'Date', 'Nature', 'Pure WT (g)', 'Taxable Value', 'GST Amount', 'Grand Total', 'Status'];
    const rows = customerEstimates.map((est) => [
      est.estimateNo,
      est.estimateDate,
      est.transactionType || 'SALE',
      est.totals.totalPureWT.toFixed(3),
      est.totals.taxableValue.toFixed(2),
      est.totals.gstAmount.toFixed(2),
      est.totals.grandTotal.toFixed(2),
      est.status,
    ]);

    downloadCSV(
      `${customer.name.replace(/\s+/g, '_')}_Estimates.csv`,
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    );
  };

  const handleExportCSV = () => {
    if (activeProfileTab === 'ledger') {
      exportCashLedger();
    } else if (activeProfileTab === 'estimates') {
      exportEstimates();
    } else {
      exportGCAccount();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Back Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {!isClient ? (
          <button
            onClick={() => onNavigate('customers')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0F5C5B] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Customer Master
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0F5C5B] bg-[#0F5C5B]/10 px-3 py-1.5 rounded-full">
              Client Portal Account View
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!isClient && (
            <SBGButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-[#0F5C5B]" />}
              onClick={() => setIsGoogleSheetModalOpen(true)}
            >
              Import / Sync Sheet
            </SBGButton>
          )}

          {/* Dual Export Buttons */}
          <div className="flex items-center gap-1.5">
            <SBGButton
              variant="glass"
              size="sm"
              icon={<Download className="w-4 h-4 text-[#0F5C5B]" />}
              onClick={exportGCAccount}
              title="Export Pure Gold & MC GC Account (CSV)"
            >
              Export GC Account
            </SBGButton>
            <SBGButton
              variant="glass"
              size="sm"
              icon={<Download className="w-4 h-4 text-[#0F5C5B]" />}
              onClick={exportCashLedger}
              title="Export Commercial Cash Ledger (CSV)"
            >
              Export Cash Ledger
            </SBGButton>
          </div>

          {!isClient && (
            <SBGButton
              variant="primary"
              size="sm"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setIsTxModalOpen(true)}
            >
              Record Payment (Gold & Cash)
            </SBGButton>
          )}
        </div>
      </div>

      {/* Luxury Glass Profile Header */}
      <div className="glass-panel p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-black/5 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono font-bold text-[#D9B76C] bg-[#D9B76C]/15 px-2.5 py-0.5 rounded">
                {customer.code}
              </span>
              <SBGBadge variant={customer.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {customer.status}
              </SBGBadge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F5C5B] tracking-tight">
              {customer.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#647777] pt-1">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#0F5C5B]" /> {customer.phone}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#0F5C5B]" /> {customer.email}
                </span>
              )}
              {customer.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0F5C5B]" /> {customer.city}
                </span>
              )}
            </div>
          </div>

          {/* Luxury 3-Card Balanced Trio: Pure Gold Balance, MC Balance, Cash Ledger Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            {/* Card 1: Pure Gold Balance */}
            <div className="p-4 rounded-2xl bg-[#F4F9F8] border border-[#BDE3DB] shadow-xs flex flex-col justify-between min-w-[170px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-[#4B6B68] uppercase tracking-wider">
                  Pure Gold Balance
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  customer.currentWT >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {customer.currentWT >= 0 ? 'Due to SBG' : 'Advance by Client'}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-mono font-bold text-[#0F5C5B]">
                  {Math.abs(customer.currentWT).toFixed(3)}
                </span>
                <span className="text-xs font-semibold text-[#4B6B68]">g</span>
              </div>
            </div>

            {/* Card 2: Making Charge Balance */}
            <div className="p-4 rounded-2xl bg-[#FDF9F0] border border-[#EADBBD] shadow-xs flex flex-col justify-between min-w-[170px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-[#7A6D56] uppercase tracking-wider">
                  MC Balance
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  customer.currentMC >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {customer.currentMC >= 0 ? 'Due to SBG' : 'Advance by Client'}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xs font-semibold text-[#7A6D56]">₹</span>
                <span className="text-xl font-mono font-bold text-[#8C6418]">
                  {Math.abs(customer.currentMC).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Card 3: Cash Ledger Balance */}
            <div className="p-4 rounded-2xl bg-[#F7F5FC] border border-[#DCD5F0] shadow-xs flex flex-col justify-between min-w-[170px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-[#55477B] uppercase tracking-wider">
                  Cash Ledger Balance
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  runningCash >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {runningCash >= 0 ? 'Receivable (Due)' : 'Payable (Advance)'}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xs font-semibold text-[#55477B]">₹</span>
                <span className="text-xl font-mono font-bold text-[#3B2D6B]">
                  {Math.abs(runningCash).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Profile Tabs: GC Account, Ledger (Cash Only), Estimates */}
        <div className="flex items-center justify-between border-b border-black/10 pb-3 gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tab 1: GC Account */}
            <button
              type="button"
              onClick={() => setActiveProfileTab('gc_account')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeProfileTab === 'gc_account'
                  ? 'bg-[#0F5C5B] text-white shadow-xs'
                  : 'bg-white/80 text-[#647777] border border-[#DCE5E3] hover:text-[#173333]'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-[#D9B76C]" />
              <span>GC Account ({customerLedger.length})</span>
            </button>

            {/* Tab 2: Commercial Cash Ledger */}
            <button
              type="button"
              onClick={() => setActiveProfileTab('ledger')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeProfileTab === 'ledger'
                  ? 'bg-[#0F5C5B] text-white shadow-xs'
                  : 'bg-white/80 text-[#647777] border border-[#DCE5E3] hover:text-[#173333]'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Ledger ({cashLedgerRows.length + (openingBalance !== 0 ? 1 : 0)})</span>
            </button>

            {/* Tab 3: Estimates */}
            <button
              type="button"
              onClick={() => setActiveProfileTab('estimates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeProfileTab === 'estimates'
                  ? 'bg-[#0F5C5B] text-white shadow-xs'
                  : 'bg-white/80 text-[#647777] border border-[#DCE5E3] hover:text-[#173333]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Estimates ({customerEstimates.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeProfileTab === 'estimates' && (
              <button
                type="button"
                onClick={() => onNavigate('new-estimate', customer.id)}
                className="px-3.5 py-1.5 rounded-xl bg-[#E5C378] hover:bg-[#D9B76C] text-[#3D2D0C] font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create Estimate for {customer.name}</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: GC ACCOUNT (GOLD & CASH DUAL BALANCE RUNNING SHEET)                 */}
        {/* ========================================================================= */}
        {activeProfileTab === 'gc_account' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#D9B76C]" />
                  GC Account: Dual Metal (Pure WT) & Currency (MC) Running Balances
                </h3>
                <p className="text-[11px] text-[#647777]">
                  ISSUE = Customer Debit (+) | RECEIPT = Customer Credit (-)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseSheetTheme(!useSheetTheme)}
                  title={useSheetTheme ? 'Colors enabled (Click to toggle)' : 'Colors disabled (Click to toggle)'}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                    useSheetTheme
                      ? 'bg-[#0F5C5B]/10 text-[#0F5C5B] border-[#0F5C5B]/30'
                      : 'bg-white text-[#647777] border-[#DCE5E3]'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Colors</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto bg-white/80 rounded-xl border border-[#DCE5E3] shadow-xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#0F5C5B]/10 text-[#0F5C5B] border-b border-[#DCE5E3] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Particulars</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 text-right">Nos</th>
                    <th className="py-3 px-3 text-right">Gross WT</th>
                    <th className="py-3 px-3 text-right">Stone WT</th>
                    <th className="py-3 px-3 text-right">Net WT</th>
                    <th className="py-3 px-3 text-right">Touch</th>
                    <th className="py-3 px-3 text-right">Pure WT</th>
                    <th className="py-3 px-3 text-right">Stone Amt (₹)</th>
                    <th className="py-3 px-3 text-right">MC Amt (₹)</th>
                    <th className="py-3 px-3 text-right">Total Amt (₹)</th>
                    <th className="py-3 px-3 text-right font-bold text-[#0F5C5B] bg-[#0F5C5B]/10">Balance MC (₹)</th>
                    <th className="py-3 px-3 text-right font-bold text-[#0F5C5B] bg-[#0F5C5B]/10">Balance WT (g)</th>
                    {!isClient && <th className="py-3 px-3 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5E3]/60 font-mono">
                  {/* Opening Balance Row */}
                  <tr className="bg-amber-50/70 font-semibold text-[#173333]">
                    <td className="py-2.5 px-3">-</td>
                    <td className="py-2.5 px-3">OPEN</td>
                    <td className="py-2.5 px-3 font-bold text-[#0F5C5B]">OPENING</td>
                    <td className="py-2.5 px-3 font-sans text-[#647777]">Opening GC Account Balance</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">0.000</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right font-bold">0.000</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right font-bold bg-[#0F5C5B]/5 text-[#173333]">
                      ₹{customer.openingMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold bg-[#0F5C5B]/5 text-[#173333]">
                      {customer.openingWT.toFixed(3)}
                    </td>
                    {!isClient && <td className="py-2.5 px-3 text-center">-</td>}
                  </tr>

                  {customerLedger.map((tx) => {
                    const isReceipt = tx.direction === 'RECEIPT';
                    const rowBgClass = useSheetTheme
                      ? isReceipt
                        ? 'bg-[#FCE8E6] text-[#900C3F]'
                        : 'bg-[#D9EAD3] text-[#1E4620]'
                      : 'hover:bg-white/90 transition-colors';

                    return (
                      <tr key={tx.id} className={`${rowBgClass} transition-colors border-b border-black/5`}>
                        <td className="py-2.5 px-3 font-semibold">{tx.date}</td>
                        <td className="py-2.5 px-3 font-bold">
                          <span
                            className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                              isReceipt
                                ? 'bg-red-200/80 text-red-800'
                                : 'bg-emerald-200/80 text-emerald-900'
                            }`}
                          >
                            {tx.direction}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold uppercase">{tx.particulars}</td>
                        <td className="py-2.5 px-3 font-sans max-w-xs truncate font-medium">
                          {tx.estimateId ? (
                            <button
                              type="button"
                              onClick={() => onNavigate('estimate-details', tx.estimateId)}
                              className="text-[#0F5C5B] font-bold hover:underline cursor-pointer flex items-center gap-1 text-left"
                            >
                              <span>{tx.description}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </button>
                          ) : (
                            tx.description
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">{tx.nos || '-'}</td>
                        <td className="py-2.5 px-3 text-right">
                          {tx.grossWT !== 0 ? Math.abs(tx.grossWT).toFixed(3) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right opacity-80">
                          {tx.stoneWT !== 0 ? Math.abs(tx.stoneWT).toFixed(3) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {tx.netWT !== 0 ? tx.netWT.toFixed(3) : '0.000'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {tx.touch > 0 ? `${tx.touch.toFixed(2)}%` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {tx.pureWT !== 0 ? tx.pureWT.toFixed(3) : '0.000'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {tx.stoneAmount > 0
                            ? `₹${tx.stoneAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : tx.stoneAmountCal !== 0
                            ? `₹${Math.abs(tx.stoneAmountCal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {tx.mcAmount > 0
                            ? `₹${tx.mcAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : tx.mcAmountCal !== 0
                            ? `₹${Math.abs(tx.mcAmountCal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {tx.totalAmount !== 0
                            ? `₹${Math.abs(tx.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold bg-amber-50/50">
                          <span className={tx.balanceMC < 0 ? 'text-red-700 font-bold' : 'text-emerald-800 font-bold'}>
                            ₹{tx.balanceMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold bg-amber-50/50">
                          <span className={tx.balanceWT < 0 ? 'text-red-700 font-bold' : 'text-emerald-800 font-bold'}>
                            {tx.balanceWT.toFixed(3)}
                          </span>
                        </td>
                        {!isClient && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              title="Delete transaction"
                              onClick={async () => {
                                const isLinked = Boolean(
                                  tx.estimateId || (tx.erpRef && estimates.some((e) => e.estimateNo === tx.erpRef))
                                );
                                const confirmMsg = isLinked
                                  ? `Warning: This transaction is linked to an Estimate (${tx.erpRef || tx.estimateId}).\n\nDeleting this row will automatically revert the linked Estimate to DRAFT status and remove its entry from the Cash Ledger.\n\nAre you sure you want to proceed?`
                                  : `Delete transaction from ${tx.date} (${tx.particulars})?`;
                                if (window.confirm(confirmMsg)) {
                                  await deleteTransaction(tx.id);
                                }
                              }}
                              className="p-1 rounded text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CASH-ONLY COMMERCIAL LEDGER (SINGLE POINT OF ENTRY)                */}
        {/* ========================================================================= */}
        {activeProfileTab === 'ledger' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-[#0F5C5B]" />
                  Commercial Cash Ledger (Single Point of Entry)
                </h3>
                <p className="text-[11px] text-[#647777]">
                  Auto-posts confirmed estimates (Full Bill Amount) and gold/cash payments. ISSUE (+) = Customer Debit | RECEIPT (-) = Customer Credit
                </p>
              </div>

              {/* Quick Summary Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Issues: ₹{totalCashIssues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                  Receipts: ₹{totalCashReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#0F5C5B] text-white font-bold">
                  Net Balance: ₹{runningCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto bg-white/90 rounded-2xl border border-[#DCE5E3] shadow-xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#0F5C5B]/10 text-[#0F5C5B] border-b border-[#DCE5E3] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">DATE</th>
                    <th className="py-3 px-3">TYPE</th>
                    <th className="py-3 px-3">PARTICULARS</th>
                    <th className="py-3 px-3">CUSTOMER JOB REFERENCE</th>
                    <th className="py-3 px-3">ESTIMATE NUMBER</th>
                    <th className="py-3 px-3.5 text-right font-bold">AMOUNT (₹)</th>
                    <th className="py-3 px-3.5 text-right font-bold text-[#0F5C5B] bg-[#0F5C5B]/10">
                      RUNNING BALANCE (₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5E3]/60 font-mono">
                  {/* Opening Balance Row */}
                  <tr className="bg-amber-50/70 font-semibold text-[#173333]">
                    <td className="py-2.5 px-3.5">-</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                        OPEN
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#0F5C5B]">OPENING</td>
                    <td className="py-2.5 px-3 font-sans text-[#647777]">
                      Opening Account Balance
                    </td>
                    <td className="py-2.5 px-3 text-[#647777]">-</td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-[#173333]">
                      ₹{Math.abs(openingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold bg-[#0F5C5B]/5 text-[#173333]">
                      ₹{openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Cash Ledger Event Rows */}
                  {cashLedgerRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#647777] font-sans">
                        <Banknote className="w-8 h-8 mx-auto text-[#647777]/30 mb-2" />
                        <p className="font-semibold text-xs">No commercial transactions recorded yet.</p>
                        <p className="text-[11px] text-[#647777] mt-0.5">
                          Confirmed estimates and recorded payments will automatically populate and maintain running balances here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    cashLedgerRows.map((row) => {
                      const isReceipt = row.type === 'RECEIPT';
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-[#F2FAF8]/60 transition-colors border-b border-black/5"
                        >
                          <td className="py-3 px-3.5 font-semibold text-[#173333]">
                            {row.date}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                                isReceipt
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {isReceipt ? 'RECEIPT (−)' : 'ISSUE (+)'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold uppercase text-[#0F5C5B]">
                            {row.particulars}
                          </td>
                          <td className="py-3 px-3 font-sans max-w-xs truncate text-[#173333] font-medium">
                            {row.customerJobRef}
                          </td>
                          <td className="py-3 px-3">
                            {row.estimateId ? (
                              <button
                                type="button"
                                onClick={() => onNavigate('estimate-details', row.estimateId)}
                                className="text-[#0F5C5B] font-bold hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <span>{row.estimateNo}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </button>
                            ) : (
                              <span className="text-[#647777]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-[#173333]">
                            ₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold bg-[#0F5C5B]/5">
                            <span
                              className={
                                row.balance > 0
                                  ? 'text-rose-700'
                                  : row.balance < 0
                                  ? 'text-emerald-700'
                                  : 'text-gray-700'
                              }
                            >
                              ₹{row.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CUSTOMER ESTIMATES & COST SHEETS                                    */}
        {/* ========================================================================= */}
        {activeProfileTab === 'estimates' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#0F5C5B]" />
                  Customer Estimates & Cost Sheets
                </h3>
                <p className="text-[11px] text-[#647777]">
                  Showing all estimates belonging to {customer.name} (Sorted Latest to Oldest)
                </p>
              </div>

              <span className="text-xs font-semibold text-[#526B6A]">
                Total: <strong className="text-[#173333]">{customerEstimates.length}</strong> Estimate{customerEstimates.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="overflow-x-auto bg-white/80 rounded-xl border border-[#DCE5E3] shadow-xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#0F5C5B]/10 text-[#0F5C5B] border-b border-[#DCE5E3] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">ESTIMATE NO.</th>
                    <th className="py-3 px-3">DATE</th>
                    <th className="py-3 px-3">NATURE</th>
                    <th className="py-3 px-3 text-right">PURE WT (g)</th>
                    <th className="py-3 px-3 text-right">TAXABLE VALUE</th>
                    <th className="py-3 px-3 text-right">GST (3%)</th>
                    <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">GRAND TOTAL</th>
                    <th className="py-3 px-3 text-center">STATUS</th>
                    <th className="py-3 px-3 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5E3]/60">
                  {customerEstimates.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-[#647777]">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-[#647777]/40 mb-2" />
                        <p className="font-semibold text-xs">No estimates recorded for {customer.name}</p>
                        {!isClient && (
                          <button
                            type="button"
                            onClick={() => onNavigate('new-estimate', customer.id)}
                            className="mt-2 text-xs font-bold text-[#0F5C5B] hover:underline cursor-pointer"
                          >
                            + Create first estimate
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    customerEstimates.map((est) => (
                      <tr
                        key={est.id}
                        onClick={() => onNavigate('estimate-details', est.id)}
                        className="hover:bg-white/90 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-[#0F5C5B]">
                          {est.estimateNo}
                        </td>
                        <td className="py-3 px-3 text-[#647777] font-mono">
                          {est.estimateDate}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              est.transactionType === 'PURCHASE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {est.transactionType || 'SALE'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#0F5C5B]">
                          {est.totals.totalPureWT.toFixed(3)} g
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-[#173333]">
                          ₹{est.totals.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#647777]">
                          ₹{est.totals.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-xs text-[#0F5C5B]">
                          ₹{est.totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
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
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onNavigate('estimate-details', est.id)}
                            className="p-1 rounded text-[#0F5C5B] hover:bg-[#0F5C5B]/10 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal (Payment: Gold & Cash) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        defaultCustomerId={customer.id}
        onNavigate={onNavigate}
      />

      {/* Google Sheet Copy-Paste / CSV Import Modal */}
      <GoogleSheetImportModal
        isOpen={isGoogleSheetModalOpen}
        onClose={() => setIsGoogleSheetModalOpen(false)}
        customerId={customer.id}
        customerName={customer.name}
      />
    </div>
  );
};
