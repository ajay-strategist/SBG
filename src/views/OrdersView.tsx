import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  ShoppingBag,
  Plus,
  Search,
  ChevronRight,
  Calendar,
  Filter,
  Download,
  Gem,
  ArrowUpRight,
  MoreHorizontal,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';
import { SBGModal, SBGInput, SBGSelect, SBGButton } from '../components/ui';

interface OrdersViewProps {
  onNavigate: (tab: ActiveTab, orderId?: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onNavigate }) => {
  const { orders, customers, addOrder } = useSBG();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    orderNo: `ORD-2026-${Math.floor(100 + orders.length + 1)}`,
    customerId: customers[0]?.id || '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    reference: '',
    erpRef: '',
    itemDescription: '',
    targetGrossWT: 0,
    targetPurity: 91.6,
    status: 'IN_PRODUCTION' as const,
  });

  const filteredOrders = orders.filter((o) => {
    const cust = customers.find((c) => c.id === o.customerId);
    const matchesSearch =
      o.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemDescription || !formData.customerId) return;

    addOrder({
      orderNo: formData.orderNo,
      customerId: formData.customerId,
      orderDate: formData.orderDate,
      deliveryDate: formData.deliveryDate,
      reference: formData.reference || `REF-${formData.orderNo}`,
      erpRef: formData.erpRef,
      itemDescription: formData.itemDescription,
      targetGrossWT: Number(formData.targetGrossWT) || 0,
      targetPurity: Number(formData.targetPurity) || 91.6,
      status: formData.status,
      openingWT: 0,
      openingMC: 0,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Luxury Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/90 via-white/80 to-[#F5ECE0]/80 p-6 sm:p-8 border border-white/80 shadow-sm overflow-hidden backdrop-blur-md">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0F5C5B]/10 border border-[#0F5C5B]/20 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6 text-[#0F5C5B]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#143B39] tracking-tight">
                Order Commercial Management
              </h1>
              <p className="text-xs text-[#526B6A] mt-1 font-medium">
                Commercial unit tracking linked to ERP manufacturing and stock-out references
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left sm:text-right hidden md:block border-l-2 sm:border-l-0 sm:border-r-2 border-[#D9B76C]/40 pl-3 sm:pl-0 sm:pr-4">
              <span className="text-xs text-[#526B6A] block font-medium">Flawless Crafting</span>
              <span className="text-xs font-bold text-[#C69234] block">Guaranteed Delivery</span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-[#0F5C5B] hover:bg-[#0A4847] text-white font-semibold text-xs shadow-md shadow-[#0F5C5B]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>New Commercial Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#F2FAF8] border border-[#D5EAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#4B6B68] uppercase tracking-wider">
              TOTAL ORDERS
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E2F3F0] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#0F5C5B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              {orders.length}
            </span>
            <span className="text-xs text-[#2E8B57] font-semibold mt-1 block">
              Active Lifetime
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
              IN PRODUCTION
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FDF3DE] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#C48C2B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              {orders.filter((o) => o.status === 'IN_PRODUCTION').length}
            </span>
            <span className="text-xs text-[#7A6D56] font-medium mt-1 block">
              On workshop bench
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#F2FAF8] border border-[#D5EAE5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#4B6B68] uppercase tracking-wider">
              SETTLED / COMPLETED
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E2F3F0] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#0F5C5B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              {orders.filter((o) => o.status === 'SETTLED' || o.status === 'COMPLETED').length}
            </span>
            <span className="text-xs text-[#2E8B57] font-semibold mt-1 block">
              Fulfilled & Delivered
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
              PENDING CONFIRMATION
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FDF3DE] flex items-center justify-center">
              <Gem className="w-4 h-4 text-[#C48C2B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              {orders.filter((o) => o.status === 'PENDING').length}
            </span>
            <span className="text-xs text-[#7A6D56] font-medium mt-1 block">
              Awaiting casting gold
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
            placeholder="Search Order No., customer, ERP ref, or job description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B]"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="PENDING">Pending</option>
            <option value="SETTLED">Settled</option>
          </select>

          <button
            onClick={() => alert('Exporting Commercial Orders report...')}
            className="px-3 py-2 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium text-xs flex items-center gap-1.5 hover:bg-[#F0EBE1] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#647777]" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ORDER NO.</th>
                <th className="py-3.5 px-4">CUSTOMER</th>
                <th className="py-3.5 px-4">ORDER DATE</th>
                <th className="py-3.5 px-4">REFERENCE / ERP</th>
                <th className="py-3.5 px-4">DESCRIPTION</th>
                <th className="py-3.5 px-4 text-right">TARGET WT</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {filteredOrders.map((ord) => {
                const customer = customers.find((c) => c.id === ord.customerId);

                return (
                  <tr
                    key={ord.id}
                    onClick={() => onNavigate('order-details', ord.id)}
                    className="hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-[#0F5C5B]">
                      {ord.orderNo}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#173333]">{customer?.name || 'Customer'}</div>
                      <div className="text-[10px] text-[#647777] font-mono">{customer?.code}</div>
                    </td>
                    <td className="py-4 px-4 text-[#647777] font-mono">
                      {ord.orderDate}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#173333]">{ord.reference}</div>
                      {ord.erpRef && (
                        <span className="text-[9.5px] font-mono text-[#0F5C5B] bg-[#E1F5F3] px-1.5 py-0.5 rounded font-bold">
                          {ord.erpRef}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 max-w-xs truncate text-[#647777]">
                      {ord.itemDescription}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-[#173333]">
                      {ord.targetGrossWT ? `${ord.targetGrossWT.toFixed(3)} g` : '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                          ord.status === 'SETTLED'
                            ? 'bg-[#E6F8F2] text-[#1A825B]'
                            : ord.status === 'IN_PRODUCTION'
                            ? 'bg-[#FEF5E6] text-[#B87B1D]'
                            : 'bg-[#FBF4E4] text-[#966E1D]'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td
                      className="py-4 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onNavigate('order-details', ord.id)}
                        className="px-3 py-1 rounded-xl bg-white border border-[#DCE5E3] hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F5C5B] cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      <SBGModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Commercial Order"
        size="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SBGInput
              label="Order Number"
              value={formData.orderNo}
              onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
              required
            />
            <SBGSelect
              label="Customer Account"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              options={customers.map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }))}
              required
            />
            <SBGInput
              label="Order Date"
              type="date"
              value={formData.orderDate}
              onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
              required
            />
            <SBGInput
              label="Target Delivery Date"
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
            />
            <SBGInput
              label="Customer Reference"
              placeholder="e.g. REF-BRIDAL-SET-01"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
            <SBGInput
              label="ERP Stock-Out / Job Reference"
              placeholder="e.g. ERP-SO-8899"
              value={formData.erpRef}
              onChange={(e) => setFormData({ ...formData, erpRef: e.target.value })}
            />
            <SBGInput
              label="Target Gross WT (g)"
              type="number"
              step="0.001"
              value={formData.targetGrossWT}
              onChange={(e) => setFormData({ ...formData, targetGrossWT: parseFloat(e.target.value) || 0 })}
            />
            <SBGInput
              label="Target Purity / Touch (%)"
              type="number"
              step="0.1"
              value={formData.targetPurity}
              onChange={(e) => setFormData({ ...formData, targetPurity: parseFloat(e.target.value) || 91.6 })}
            />
          </div>

          <SBGInput
            label="Item & Crafting Description"
            placeholder="e.g. 22kt Antique Necklace with floral polki setting..."
            value={formData.itemDescription}
            onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
            required
          />

          <div className="pt-4 border-t border-[#DCE5E3] flex justify-end gap-3">
            <SBGButton variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </SBGButton>
            <SBGButton variant="primary" type="submit">
              Create Commercial Order
            </SBGButton>
          </div>
        </form>
      </SBGModal>
    </div>
  );
};
