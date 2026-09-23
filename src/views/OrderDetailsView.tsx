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
  ShoppingBag,
  ArrowLeft,
  BookOpen,
  FileSpreadsheet,
  Coins,
  ChevronRight,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';

interface OrderDetailsViewProps {
  orderId: string;
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
}

export const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({
  orderId,
  onNavigate,
}) => {
  const { orders, customers, getOrderTransactions, estimates, settlements } = useSBG();

  const order = orders.find((o) => o.id === orderId) || orders[0];
  const customer = customers.find((c) => c.id === order.customerId);
  const orderTransactions = getOrderTransactions(order.id);
  const orderEstimates = estimates.filter((e) => e.orderId === order.id);
  const orderSettlements = settlements.filter((s) => s.orderId === order.id);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[#647777]">Order not found.</p>
        <SBGButton variant="outline" className="mt-4" onClick={() => onNavigate('orders')}>
          Return to Orders
        </SBGButton>
      </div>
    );
  }

  // Calculate Order Commercial Impact
  const totalPureWT = orderTransactions.reduce((acc, t) => acc + t.pureWT, 0);
  const totalMC = orderTransactions.reduce((acc, t) => acc + t.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('orders')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0F5C5B] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>

        <div className="flex items-center gap-2.5">
          <SBGButton
            variant="glass"
            size="sm"
            icon={<Coins className="w-4 h-4 text-[#D9B76C]" />}
            onClick={() => onNavigate('new-settlement', customer?.id)}
          >
            Settle Order
          </SBGButton>
          <SBGButton
            variant="gold"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={() => onNavigate('new-estimate', customer?.id)}
          >
            Create Estimate
          </SBGButton>
          <SBGButton
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => onNavigate('new-transaction', customer?.id)}
          >
            Add Transaction
          </SBGButton>
        </div>
      </div>

      {/* Glass Order Header */}
      <div className="glass-panel p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-black/5 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-[#0F5C5B] bg-[#0F5C5B]/10 px-2.5 py-0.5 rounded">
                {order.orderNo}
              </span>
              <SBGBadge
                variant={
                  order.status === 'SETTLED'
                    ? 'success'
                    : order.status === 'IN_PRODUCTION'
                    ? 'warning'
                    : 'neutral'
                }
              >
                {order.status}
              </SBGBadge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#173333]">
              {order.itemDescription}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#647777]">
              <span>Customer: <strong className="text-[#173333]">{customer?.name}</strong></span>
              <span>Ref: <strong>{order.reference}</strong></span>
              {order.erpRef && (
                <span className="font-mono bg-[#0F5C5B]/10 text-[#0F5C5B] px-2 py-0.5 rounded font-bold">
                  ERP: {order.erpRef}
                </span>
              )}
              <span>Order Date: <strong>{order.orderDate}</strong></span>
            </div>
          </div>

          {/* Order Commercial Position */}
          <div className="bg-white/80 p-4 rounded-xl border border-white/80 shadow-sm min-w-[220px]">
            <span className="text-[10px] font-bold text-[#647777] uppercase tracking-wider block">
              Order Commercial Balance
            </span>
            <div className="text-lg font-bold text-[#0F5C5B] mt-1">
              <SBGWeight value={totalPureWT} />
            </div>
            <div className="text-sm font-bold text-[#173333] mt-0.5">
              <SBGCurrency value={totalMC} />
            </div>
          </div>
        </div>

        {/* Section 1: Linked Commercial Ledger Transactions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Commercial Ledger Entries For This Order
            </h3>
          </div>

          <div className="overflow-x-auto bg-white/70 rounded-xl border border-[#DCE5E3]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F5C5B]/5 text-[#647777] border-b border-[#DCE5E3] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Direction</th>
                  <th className="py-3 px-3">Particulars</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Gross WT</th>
                  <th className="py-3 px-3 text-right">Net WT</th>
                  <th className="py-3 px-3 text-right">Touch</th>
                  <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">Pure WT</th>
                  <th className="py-3 px-3 text-right font-bold text-[#0F5C5B]">MC Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5E3]/60">
                {orderTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-[#647777]">
                      No ledger transactions linked to this order yet.
                    </td>
                  </tr>
                ) : (
                  orderTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/90">
                      <td className="py-3 px-3 font-mono">{tx.date}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[10px] bg-black/5 px-1.5 py-0.5 rounded">
                          {tx.direction}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold">{tx.particulars}</td>
                      <td className="py-3 px-3 text-[#647777]">{tx.description}</td>
                      <td className="py-3 px-3 text-right font-mono">{tx.grossWT.toFixed(3)}g</td>
                      <td className="py-3 px-3 text-right font-mono">{tx.netWT.toFixed(3)}g</td>
                      <td className="py-3 px-3 text-right font-mono">{tx.touch.toFixed(2)}%</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={tx.pureWT < 0 ? 'text-[#B85C5C]' : 'text-[#0F5C5B]'}>
                          {tx.pureWT.toFixed(3)}g
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <SBGCurrency value={tx.totalAmount} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <SBGBadge variant="success" size="sm">{tx.status}</SBGBadge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Linked Estimates & Settlements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Linked Estimates */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Order Estimates & Cost Sheets
            </h3>
            {orderEstimates.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[#DCE5E3] text-center text-xs text-[#647777]">
                No estimate created for this order yet.
              </div>
            ) : (
              orderEstimates.map((est) => (
                <SBGCard
                  key={est.id}
                  variant="white"
                  hoverEffect
                  onClick={() => onNavigate('estimate-details', est.id)}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-xs text-[#D9B76C] bg-[#D9B76C]/15 px-2 py-0.5 rounded">
                      {est.estimateNo}
                    </span>
                    <div className="text-xs text-[#647777] mt-1">{est.estimateDate}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#647777] uppercase block">Grand Total</span>
                    <SBGCurrency value={est.totals.grandTotal} className="text-sm font-bold text-[#0F5C5B]" />
                  </div>
                </SBGCard>
              ))
            )}
          </div>

          {/* Linked Settlements */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F5C5B] flex items-center gap-2">
              <Coins className="w-4 h-4" /> Order Settlements
            </h3>
            {orderSettlements.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[#DCE5E3] text-center text-xs text-[#647777]">
                No settlements processed for this order.
              </div>
            ) : (
              orderSettlements.map((set) => (
                <SBGCard key={set.id} variant="white" className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#0F5C5B]">{set.settlementNo}</span>
                    <div className="text-xs text-[#647777] mt-1">{set.date}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#647777] uppercase block">Gold / Cash</span>
                    <span className="font-mono font-bold text-xs">{set.goldReceived.toFixed(3)}g / ₹{set.cashReceived}</span>
                  </div>
                </SBGCard>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
