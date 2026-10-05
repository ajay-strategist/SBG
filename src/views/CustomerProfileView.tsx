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
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface CustomerProfileViewProps {
  customerId: string;
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  customerId,
  onNavigate,
}) => {
  const {
    customers,
    getCustomerTransactions,
    deleteTransaction,
  } = useSBG();

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [useSheetTheme, setUseSheetTheme] = useState(true);

  const customer = customers.find((c) => c.id === customerId) || customers[0];

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

  const customerLedger = getCustomerTransactions(customer.id);

  const handleExportCSV = () => {
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
      tx.stoneAmountCal < 0
        ? `"(₹${Math.abs(tx.stoneAmountCal).toLocaleString('en-IN', { minimumFractionDigits: 2 })})"`
        : tx.stoneAmount > 0
        ? `"₹${tx.stoneAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}"`
        : 0,
      tx.mcAmount || 0,
      tx.totalAmount < 0
        ? `"(₹${Math.abs(tx.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })})"`
        : tx.totalAmount > 0
        ? `"₹${tx.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}"`
        : '"₹-"',
      tx.balanceMC < 0
        ? `"(₹${Math.abs(tx.balanceMC).toLocaleString('en-IN', { minimumFractionDigits: 2 })})"`
        : `"₹${tx.balanceMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}"`,
      tx.balanceWT,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${customer.name.replace(/\s+/g, '_')}_Customer_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Back Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('customers')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0F5C5B] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customer Master
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <SBGButton
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4 text-[#0F5C5B]" />}
            onClick={() => setIsGoogleSheetModalOpen(true)}
          >
            Import / Sync Sheet
          </SBGButton>
          <SBGButton
            variant="glass"
            size="sm"
            icon={<Download className="w-4 h-4 text-[#0F5C5B]" />}
            onClick={handleExportCSV}
          >
            Export Sheet
          </SBGButton>
          <SBGButton
            variant="gold"
            size="sm"
            icon={<Coins className="w-4 h-4" />}
            onClick={() => onNavigate('new-settlement', customer.id)}
          >
            Settle Account
          </SBGButton>
          <SBGButton
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsTxModalOpen(true)}
          >
            + New Transaction
          </SBGButton>
        </div>
      </div>

      {/* Luxury Glass Profile Header */}
      <div className="glass-panel p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 pb-5">
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

          <div className="flex items-center gap-3">
            <SBGBalanceCard
              pureWT={customer.currentWT}
              mcBalance={customer.currentMC}
              subtitle="Real-time Account Balances"
            />
          </div>
        </div>

        {/* Commercial Ledger */}
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B]">
                  Transaction History & Running Balances
                </h3>
                <p className="text-[11px] text-[#647777]">
                  ISSUE = Customer Debit (+) | RECEIPT = Customer Credit (-)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseSheetTheme(!useSheetTheme)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                    useSheetTheme
                      ? 'bg-[#0F5C5B]/10 text-[#0F5C5B] border-[#0F5C5B]/30'
                      : 'bg-white text-[#647777] border-[#DCE5E3]'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  {useSheetTheme ? 'Google Sheet Colors: ON' : 'Default Colors'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto bg-white/80 rounded-xl border border-[#DCE5E3] shadow-xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#0F5C5B]/10 text-[#0F5C5B] border-b border-[#DCE5E3] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Column1</th>
                    <th className="py-3 px-3">Particulars</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 text-right">Nos</th>
                    <th className="py-3 px-3 text-right">Gross WT</th>
                    <th className="py-3 px-3 text-right">Stone WT</th>
                    <th className="py-3 px-3 text-right">Net WT</th>
                    <th className="py-3 px-3 text-right">Touch</th>
                    <th className="py-3 px-3 text-right">Pure WT</th>
                    <th className="py-3 px-3 text-right">Stone / Total Amt</th>
                    <th className="py-3 px-3 text-right font-bold text-[#0F5C5B] bg-[#0F5C5B]/10">Balance MC (₹)</th>
                    <th className="py-3 px-3 text-right font-bold text-[#0F5C5B] bg-[#0F5C5B]/10">Balance WT (g)</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5E3]/60 font-mono">
                  {/* Opening Balance Row */}
                  <tr className="bg-amber-50/70 font-semibold text-[#173333]">
                    <td className="py-2.5 px-3">-</td>
                    <td className="py-2.5 px-3">OPEN</td>
                    <td className="py-2.5 px-3 font-bold text-[#0F5C5B]">OPENING</td>
                    <td className="py-2.5 px-3 font-sans text-[#647777]">Opening Account Ledger Balance</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">0.000</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right font-bold">0.000</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right font-bold bg-[#0F5C5B]/5 text-[#173333]">
                      ₹{customer.openingMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold bg-[#0F5C5B]/5 text-[#173333]">
                      {customer.openingWT.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3 text-center">-</td>
                  </tr>

                  {customerLedger.map((tx) => {
                    const isReceipt = tx.direction === 'RECEIPT';
                    const rowBgClass = useSheetTheme
                      ? isReceipt
                        ? 'bg-[#FCE8E6] text-[#900C3F]' // Soft Pink matching Google Sheet RECEIPT
                        : 'bg-[#D9EAD3] text-[#1E4620]' // Soft Light Green matching Google Sheet ISSUE
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
                        <td className="py-2.5 px-3 text-right">{tx.grossWT > 0 ? tx.grossWT.toFixed(3) : '-'}</td>
                        <td className="py-2.5 px-3 text-right opacity-80">{tx.stoneWT > 0 ? tx.stoneWT.toFixed(3) : '-'}</td>
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
                            : tx.totalAmount !== 0
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
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            title="Delete transaction"
                            onClick={() => {
                              if (window.confirm(`Delete transaction from ${tx.date} (${tx.particulars})?`)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1 rounded text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Transaction Modal (Purchase/Sale Cost Sheet or Gold/Cash Receipt/Payment) */}
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
