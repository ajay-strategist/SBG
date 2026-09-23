import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  SBGCard,
  SBGButton,
  SBGBadge,
  SBGCurrency,
  SBGWeight,
  SBGBalanceCard,
} from '../components/ui';
import {
  Users,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Coins,
  BookOpen,
  ShoppingBag,
  PlusCircle,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
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
    orders,
    getCustomerTransactions,
    estimates,
    settlements,
  } = useSBG();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'ledger' | 'estimates' | 'settlements'>('ledger');

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

  const customerOrders = orders.filter((o) => o.customerId === customer.id);
  const customerLedger = getCustomerTransactions(customer.id);
  const customerEstimates = estimates.filter((e) => e.customerId === customer.id);
  const customerSettlements = settlements.filter((s) => s.customerId === customer.id);

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

        <div className="flex items-center gap-2.5">
          <SBGButton
            variant="glass"
            size="sm"
            icon={<Coins className="w-4 h-4 text-[#D9B76C]" />}
            onClick={() => onNavigate('new-settlement', customer.id)}
          >
            Settle Account
          </SBGButton>
          <SBGButton
            variant="gold"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={() => onNavigate('new-estimate', customer.id)}
          >
            New Estimate
          </SBGButton>
          <SBGButton
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => onNavigate('new-transaction', customer.id)}
          >
            Add Transaction
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
              {customer.gstin && (
                <span className="font-mono text-[11px] bg-black/5 px-2 py-0.5 rounded text-[#173333]">
                  GST: {customer.gstin}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Live Dual Balance Widgets */}
            <div className="bg-white/80 p-4 rounded-xl border border-white/80 shadow-sm min-w-[180px]">
              <span className="text-[10px] font-bold text-[#647777] uppercase tracking-wider block">
                Pure Gold Balance
              </span>
              <div className="text-xl font-bold tracking-tight mt-1">
                <span className={customer.currentWT < 0 ? 'text-[#B85C5C]' : 'text-[#0F5C5B]'}>
                  <SBGWeight value={customer.currentWT} />
                </span>
              </div>
              <span className="text-[10px] text-[#647777] block mt-0.5">Opening: {customer.openingWT.toFixed(3)}g</span>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border border-white/80 shadow-sm min-w-[180px]">
              <span className="text-[10px] font-bold text-[#647777] uppercase tracking-wider block">
                MC Balance (Cash)
              </span>
              <div className="text-xl font-bold text-[#173333] tracking-tight mt-1">
                <SBGCurrency value={customer.currentMC} />
              </div>
              <span className="text-[10px] text-[#647777] block mt-0.5">Opening: ₹{customer.openingMC.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-[#DCE5E3]/80 pb-1 overflow-x-auto">
          {[
            { id: 'ledger', label: 'Commercial Ledger', icon: BookOpen, count: customerLedger.length },
            { id: 'orders', label: 'Orders', icon: ShoppingBag, count: customerOrders.length },
            { id: 'estimates', label: 'Estimates / Cost Sheets', icon: FileSpreadsheet, count: customerEstimates.length },
            { id: 'settlements', label: 'Settlements', icon: Coins, count: customerSettlements.length },
            { id: 'overview', label: 'Account Details', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0F5C5B] text-white shadow-sm'
                    : 'text-[#647777] hover:text-[#173333] hover:bg-black/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#0F5C5B]/10 text-[#0F5C5B]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Ledger Tab */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B]">
                Transaction History & Running Balances
              </h3>
              <span className="text-xs text-[#647777]">
                Calculated strictly via SBG Engine (ISSUE = + / RECEIPT = -)
              </span>
            </div>

            <div className="overflow-x-auto bg-white/70 rounded-xl border border-[#DCE5E3]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F5C5B]/5 text-[#647777] border-b border-[#DCE5E3] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Dir</th>
                    <th className="py-3 px-3">Particulars</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3 text-right">Nos</th>
                    <th className="py-3 px-3 text-right">Gross WT</th>
                    <th className="py-3 px-3 text-right">Stone WT</th>
                    <th className="py-3 px-3 text-right">Net WT</th>
                    <th className="py-3 px-3 text-right">Touch</th>
                    <th className="py-3 px-3 text-right">Pure WT</th>
                    <th className="py-3 px-3 text-right">Total MC</th>
                    <th className="py-3 px-3 text-right font-bold text-[#0F5C5B] bg-[#0F5C5B]/5">Bal Pure WT</th>
                    <th className="py-3 px-3 text-right font-bold text-[#0F5C5B] bg-[#0F5C5B]/5">Bal MC</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5E3]/60">
                  {/* Opening Balance Row */}
                  <tr className="bg-[#0F5C5B]/5 font-semibold text-[#0F5C5B]">
                    <td className="py-2.5 px-3 font-mono">-</td>
                    <td className="py-2.5 px-3">OPEN</td>
                    <td className="py-2.5 px-3">OPENING BALANCE</td>
                    <td className="py-2.5 px-3 text-[#647777]">Opening Account Ledger Balance</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right font-mono">{customer.openingWT.toFixed(3)}g</td>
                    <td className="py-2.5 px-3 text-right font-mono">₹{customer.openingMC.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold bg-[#0F5C5B]/10">{customer.openingWT.toFixed(3)}g</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold bg-[#0F5C5B]/10">₹{customer.openingMC.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-center">
                      <SBGBadge variant="teal" size="sm">OPEN</SBGBadge>
                    </td>
                  </tr>

                  {customerLedger.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/90 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold">{tx.date}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                            tx.direction === 'ISSUE'
                              ? 'bg-[#0F5C5B]/10 text-[#0F5C5B]'
                              : 'bg-[#D9B76C]/25 text-[#8C6A23]'
                          }`}
                        >
                          {tx.direction}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#173333]">{tx.particulars}</td>
                      <td className="py-3 px-3 text-[#647777] max-w-xs truncate">{tx.description}</td>
                      <td className="py-3 px-3 text-right font-mono">{tx.nos}</td>
                      <td className="py-3 px-3 text-right font-mono">{tx.grossWT.toFixed(3)}</td>
                      <td className="py-3 px-3 text-right font-mono text-[#647777]">{tx.stoneWT.toFixed(3)}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium">
                        <span className={tx.netWT < 0 ? 'text-[#B85C5C]' : 'text-[#0F5C5B]'}>
                          {tx.netWT.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{tx.touch.toFixed(2)}%</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={tx.pureWT < 0 ? 'text-[#B85C5C]' : 'text-[#0F5C5B]'}>
                          {tx.pureWT.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">
                        <SBGCurrency value={tx.totalAmount} />
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold bg-[#0F5C5B]/5">
                        <span className={tx.balanceWT < 0 ? 'text-[#B85C5C]' : 'text-[#0F5C5B]'}>
                          {tx.balanceWT.toFixed(3)} g
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold bg-[#0F5C5B]/5">
                        <SBGCurrency value={tx.balanceMC} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <SBGBadge variant={tx.status === 'CONFIRMED' ? 'success' : 'neutral'} size="sm">
                          {tx.status}
                        </SBGBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B]">
                Customer Commercial Orders
              </h3>
              <SBGButton
                variant="primary"
                size="sm"
                icon={<PlusCircle className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('orders')}
              >
                Create Order
              </SBGButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerOrders.map((ord) => (
                <SBGCard
                  key={ord.id}
                  variant="white"
                  hoverEffect
                  onClick={() => onNavigate('order-details', ord.id)}
                  className="p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#0F5C5B]">{ord.orderNo}</span>
                      <h4 className="font-bold text-sm text-[#173333] mt-1">{ord.itemDescription}</h4>
                    </div>
                    <SBGBadge
                      variant={
                        ord.status === 'IN_PRODUCTION'
                          ? 'warning'
                          : ord.status === 'SETTLED'
                          ? 'success'
                          : 'neutral'
                      }
                    >
                      {ord.status}
                    </SBGBadge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#DCE5E3]">
                    <div>
                      <span className="text-[#647777] block text-[10px] uppercase">Reference</span>
                      <span className="font-semibold">{ord.reference}</span>
                    </div>
                    <div>
                      <span className="text-[#647777] block text-[10px] uppercase">ERP Sync Ref</span>
                      <span className="font-mono font-semibold text-[#0F5C5B]">{ord.erpRef || 'N/A'}</span>
                    </div>
                  </div>
                </SBGCard>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Estimates Tab */}
        {activeTab === 'estimates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B]">
                Cost Sheets & Estimates
              </h3>
              <SBGButton
                variant="gold"
                size="sm"
                icon={<PlusCircle className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('new-estimate', customer.id)}
              >
                New Estimate
              </SBGButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerEstimates.map((est) => (
                <SBGCard
                  key={est.id}
                  variant="glass"
                  hoverEffect
                  onClick={() => onNavigate('estimate-details', est.id)}
                  className="p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#D9B76C] bg-[#D9B76C]/15 px-2 py-0.5 rounded">
                        {est.estimateNo}
                      </span>
                      <div className="text-xs text-[#647777] mt-1">{est.estimateDate}</div>
                    </div>
                    <SBGBadge variant={est.balanceComparison.isReconciled ? 'success' : 'warning'}>
                      {est.balanceComparison.isReconciled ? 'Reconciled' : 'Delta Review'}
                    </SBGBadge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-[#DCE5E3]">
                    <div>
                      <span className="text-[10px] text-[#647777] uppercase block">Pure Gold</span>
                      <span className="font-mono font-bold text-[#0F5C5B]">{est.totals.totalPureWT.toFixed(3)}g</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#647777] uppercase block">Taxable</span>
                      <SBGCurrency value={est.totals.taxableValue} className="text-xs" />
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#647777] uppercase block">Grand Total</span>
                      <SBGCurrency value={est.totals.grandTotal} className="text-xs font-bold text-[#0F5C5B]" />
                    </div>
                  </div>
                </SBGCard>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Settlements Tab */}
        {activeTab === 'settlements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B]">
                Gold & Cash Settlements
              </h3>
              <SBGButton
                variant="glass"
                size="sm"
                icon={<PlusCircle className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('new-settlement', customer.id)}
              >
                New Settlement
              </SBGButton>
            </div>

            <div className="space-y-3">
              {customerSettlements.map((set) => (
                <SBGCard key={set.id} variant="white" className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#0F5C5B]">{set.settlementNo}</span>
                      <SBGBadge variant="gold">{set.settlementType}</SBGBadge>
                    </div>
                    <p className="text-xs text-[#647777]">{set.notes || 'Settlement completed'}</p>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <span className="text-[10px] text-[#647777] uppercase block">Gold Received</span>
                      <span className="font-mono font-bold text-[#0F5C5B]">{set.goldReceived.toFixed(3)} g</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#647777] uppercase block">Cash Received</span>
                      <SBGCurrency value={set.cashReceived} />
                    </div>
                  </div>
                </SBGCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
