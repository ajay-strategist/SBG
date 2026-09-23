import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  Users,
  Plus,
  Search,
  ChevronDown,
  Filter,
  Download,
  List,
  Grid,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  ShoppingBag,
  Coins,
  Check,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';
import { SBGModal, SBGInput, SBGButton } from '../components/ui';

interface CustomersViewProps {
  onNavigate: (tab: ActiveTab, customerId?: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onNavigate }) => {
  const { customers, orders, addCustomer } = useSBG();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for Add Customer
  const [formData, setFormData] = useState({
    code: `SBG-C${100 + customers.length + 1}`,
    name: '',
    phone: '',
    email: '',
    city: 'Mumbai, Maharashtra',
    gstin: '',
    openingWT: 0,
    openingMC: 0,
    status: 'ACTIVE' as const,
  });

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && c.status === 'ACTIVE') ||
      (statusFilter === 'INACTIVE' && c.status === 'INACTIVE');

    const matchesCity = cityFilter === 'ALL' || (c.city && c.city.includes(cityFilter));

    return matchesSearch && matchesStatus && matchesCity;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    addCustomer({
      code: formData.code,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      gstin: formData.gstin,
      openingWT: Number(formData.openingWT) || 0,
      openingMC: Number(formData.openingMC) || 0,
      status: formData.status,
    });

    setIsModalOpen(false);
    setFormData({
      code: `SBG-C${100 + customers.length + 2}`,
      name: '',
      phone: '',
      email: '',
      city: 'Mumbai, Maharashtra',
      gstin: '',
      openingWT: 0,
      openingMC: 0,
      status: 'ACTIVE',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white/90 via-white/80 to-[#F5ECE0]/80 p-6 sm:p-8 border border-white/80 shadow-sm overflow-hidden backdrop-blur-md">
        {/* Background luxury jewelry artwork */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-40 overflow-hidden hidden md:block">
          <svg className="w-full h-full object-cover" viewBox="0 0 600 200" fill="none">
            <circle cx="500" cy="100" r="70" stroke="#D9B76C" strokeWidth="1.5" strokeDasharray="5 5" />
            <path d="M200 40 Q 380 180 580 80" stroke="#E7CCA0" strokeWidth="2" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0F5C5B]/10 border border-[#0F5C5B]/20 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-[#0F5C5B]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#143B39] tracking-tight">
                Customer Master
              </h1>
              <p className="text-xs text-[#526B6A] mt-1 font-medium">
                Manage customer accounts, gold positions and making charge ledgers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-left sm:text-right hidden md:block border-l-2 sm:border-l-0 sm:border-r-2 border-[#D9B76C]/40 pl-3 sm:pl-0 sm:pr-4">
              <span className="text-xs text-[#526B6A] block font-medium">Trusted Relationships</span>
              <span className="text-xs font-bold text-[#C69234] block">Lasting Value</span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-[#0F5C5B] hover:bg-[#0A4847] text-white font-semibold text-xs shadow-md shadow-[#0F5C5B]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL CUSTOMERS */}
        <div className="p-5 rounded-2xl bg-[#F2FAF8] border border-[#D5EAE5] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#4B6B68] uppercase tracking-wider">
              TOTAL CUSTOMERS
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#E2F3F0] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#0F5C5B]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#133837] tracking-tight block">
              {customers.length}
            </span>
            <div className="flex items-center gap-1 text-xs text-[#2E8B57] font-semibold mt-1">
              <span>↑</span> Active Directory
            </div>
          </div>
        </div>

        {/* Card 2: ACTIVE CUSTOMERS */}
        {(() => {
          const activeCount = customers.filter((c) => c.status === 'ACTIVE').length;
          const pct = customers.length > 0 ? Math.round((activeCount / customers.length) * 100) : (customers.length === 0 ? 100 : 0);
          return (
            <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs relative overflow-hidden flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
                    ACTIVE CUSTOMERS
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-[#133837] tracking-tight block">
                    {activeCount}
                  </span>
                  <div className="text-xs text-[#7A6D56] font-medium mt-1">
                    {pct}% of total
                  </div>
                </div>
              </div>

              {/* Circular Progress Gauge */}
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#E8DFC8]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#0F5C5B]"
                    strokeDasharray={`${pct}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-[#143B39]">{pct}%</span>
              </div>
            </div>
          );
        })()}

        {/* Card 3: TOTAL OPEN ORDERS */}
        {(() => {
          const openOrdersCount = orders.filter(
            (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'SETTLED'
          ).length;
          return (
            <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
                  TOTAL OPEN ORDERS
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#FDF3DE] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-[#C48C2B]" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-[#133837] tracking-tight block">
                  {openOrdersCount}
                </span>
                <div className="flex items-center gap-1 text-xs text-[#2E8B57] font-semibold mt-1">
                  <span>●</span> In Pipeline
                </div>
              </div>
            </div>
          );
        })()}

        {/* Card 4: TOTAL OUTSTANDING (MC) */}
        {(() => {
          const totalMC = customers.reduce((acc, c) => acc + (c.currentMC || 0), 0);
          return (
            <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
                  TOTAL OUTSTANDING (MC)
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#FDF3DE] flex items-center justify-center">
                  <Coins className="w-4 h-4 text-[#C48C2B]" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-[26px] font-bold text-[#133837] tracking-tight block font-mono">
                  ₹ {totalMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <div className="text-xs text-[#7A6D56] font-medium mt-1">
                  Across all customer ledgers
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Search and Filters Bar */}
      <div className="p-3.5 rounded-2xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 text-[#647777] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, code, phone, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Surat">Surat</option>
            <option value="Jaipur">Jaipur</option>
            <option value="Chennai">Chennai</option>
            <option value="Ahmedabad">Ahmedabad</option>
            <option value="Kolkata">Kolkata</option>
          </select>

          <button
            onClick={() => {}}
            className="px-3 py-2 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium text-xs flex items-center gap-1.5 hover:bg-[#F0EBE1] cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-[#647777]" />
            <span>More Filters</span>
            <ChevronDown className="w-3 h-3 text-[#647777]" />
          </button>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setCityFilter('ALL');
            }}
            className="text-xs font-semibold text-[#0F5C5B] hover:underline px-2 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Customer List Card & Table */}
      <div className="rounded-3xl bg-white/85 border border-[#E2E8E6] shadow-xs backdrop-blur-md overflow-hidden">
        {/* Table Top Header */}
        <div className="px-6 py-4 border-b border-[#E2E8E6] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#143B39] border-b-2 border-[#C48C2B] pb-4 inline-block">
              CUSTOMER LIST
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Exporting Customer Master list to Excel...')}
              className="px-3 py-1.5 rounded-xl border border-[#DCE5E3] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#173333] flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#647777]" />
              <span>Export</span>
            </button>

            <div className="flex items-center rounded-xl border border-[#DCE5E3] bg-white p-0.5 shadow-2xs">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-[#0F5C5B]/10 text-[#0F5C5B]'
                    : 'text-[#647777] hover:text-[#173333]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-[#0F5C5B]/10 text-[#0F5C5B]'
                    : 'text-[#647777] hover:text-[#173333]'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-[#647777] border-b border-[#E2E8E6] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredCustomers.length}
                    onChange={handleSelectAll}
                    className="rounded border-[#DCE5E3] text-[#0F5C5B] focus:ring-[#0F5C5B]"
                  />
                </th>
                <th className="py-3.5 px-4">CUSTOMER</th>
                <th className="py-3.5 px-4">CODE</th>
                <th className="py-3.5 px-4 text-right">CURRENT PURE WT (g)</th>
                <th className="py-3.5 px-4 text-right">CURRENT MC (₹)</th>
                <th className="py-3.5 px-4 text-center">OPEN ORDERS</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#647777]">
                    <Users className="w-10 h-10 mx-auto text-[#647777]/40 mb-2" />
                    <p className="font-semibold text-sm">No customers in database</p>
                    <p className="text-xs text-[#647777]/70 mt-1">
                      Click &quot;Add New Customer&quot; to create your first customer profile.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const openOrdersCount = orders.filter(
                    (o) => o.customerId === cust.id && o.status !== 'SETTLED' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
                  ).length;
                  const isSelected = selectedIds.includes(cust.id);

                  return (
                    <tr
                      key={cust.id}
                      className={`hover:bg-[#FAF8F5] transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#FAF8F5]' : ''
                      }`}
                      onClick={() => onNavigate('customer-profile', cust.id)}
                    >
                      <td
                        className="py-4 px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(cust.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(cust.id)}
                          className="rounded border-[#DCE5E3] text-[#0F5C5B] focus:ring-[#0F5C5B]"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#173333] text-xs">
                          {cust.name}
                        </div>
                        <div className="text-[11px] text-[#647777] mt-0.5">
                          {cust.city || 'Mumbai, Maharashtra'}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-[#173333]">
                        {cust.code}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            cust.currentWT < 0
                              ? 'text-[#C24141]'
                              : cust.currentWT > 0
                              ? 'text-[#1B7C5A]'
                              : 'text-[#647777]'
                          }
                        >
                          {cust.currentWT.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-[#173333]">
                        {cust.currentMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FAF0DC] text-[#7A5B18] font-bold text-xs">
                          {openOrdersCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                            cust.status === 'ACTIVE'
                              ? 'bg-[#E6F8F2] text-[#1A825B]'
                              : 'bg-[#FEECEC] text-[#C24141]'
                          }`}
                        >
                          {cust.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td
                        className="py-4 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5 text-[#647777]">
                          <button
                            onClick={() => onNavigate('customer-profile', cust.id)}
                            className="p-1.5 rounded-lg hover:bg-white hover:text-[#0F5C5B] transition-colors cursor-pointer"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-white hover:text-[#173333] transition-colors cursor-pointer"
                            title="More options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="px-6 py-4 border-t border-[#E2E8E6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#647777]">
          <div>
            Showing <span className="font-bold text-[#173333]">{filteredCustomers.length > 0 ? 1 : 0}</span> to{' '}
            <span className="font-bold text-[#173333]">{filteredCustomers.length}</span> of{' '}
            <span className="font-bold text-[#173333]">{filteredCustomers.length}</span> customers
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-[#DCE5E3] hover:bg-white disabled:opacity-40 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#0F5C5B] text-white font-bold text-xs">
              1
            </button>
            <button className="w-8 h-8 rounded-lg border border-[#DCE5E3] hover:bg-white font-medium text-xs cursor-pointer">
              2
            </button>
            <button className="w-8 h-8 rounded-lg border border-[#DCE5E3] hover:bg-white font-medium text-xs cursor-pointer">
              3
            </button>
            <button className="w-8 h-8 rounded-lg border border-[#DCE5E3] hover:bg-white font-medium text-xs cursor-pointer">
              4
            </button>
            <button className="w-8 h-8 rounded-lg border border-[#DCE5E3] hover:bg-white font-medium text-xs cursor-pointer">
              5
            </button>
            <span className="px-1 text-[#647777]">...</span>
            <button className="w-8 h-8 rounded-lg border border-[#DCE5E3] hover:bg-white font-medium text-xs cursor-pointer">
              22
            </button>
            <button className="p-1.5 rounded-lg border border-[#DCE5E3] hover:bg-white cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      <SBGModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Customer Account"
        size="lg"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SBGInput
              label="Account Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <SBGInput
              label="Customer / Company Name"
              placeholder="e.g. Navratan Jewellers Pvt Ltd"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <SBGInput
              label="Contact Phone"
              placeholder="+91 98XXX XXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <SBGInput
              label="Email Address"
              placeholder="accounts@jeweller.com"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <SBGInput
              label="City & State"
              placeholder="Mumbai, Maharashtra"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <SBGInput
              label="GSTIN / Tax ID"
              placeholder="27AABCT1234M1Z2"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            />
            <SBGInput
              label="Opening Pure Gold Weight (g)"
              type="number"
              step="0.001"
              suffixText="grams"
              value={formData.openingWT}
              onChange={(e) => setFormData({ ...formData, openingWT: parseFloat(e.target.value) || 0 })}
            />
            <SBGInput
              label="Opening Making Charge Balance (₹)"
              type="number"
              step="0.01"
              suffixText="INR"
              value={formData.openingMC}
              onChange={(e) => setFormData({ ...formData, openingMC: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="pt-4 border-t border-[#DCE5E3] flex justify-end gap-3">
            <SBGButton variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </SBGButton>
            <SBGButton variant="primary" type="submit">
              Save Customer
            </SBGButton>
          </div>
        </form>
      </SBGModal>
    </div>
  );
};
