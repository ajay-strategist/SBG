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
  Scale,
  Coins,
  Check,
  Edit3,
  Trash2,
} from 'lucide-react';
import { ActiveTab } from '../components/layout/AppShell';
import { Customer } from '../core/calculations/types';
import { SBGModal, SBGInput, SBGButton, TransactionModal } from '../components/ui';

interface CustomersViewProps {
  onNavigate: (tab: ActiveTab, customerId?: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onNavigate }) => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useSBG();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [ledgerFilter, setLedgerFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTxCustId, setSelectedTxCustId] = useState<string | undefined>();
  const [activeMenuCustId, setActiveMenuCustId] = useState<string | null>(null);

  // Edit Customer Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    gstin: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // Form State for Add Customer (Kerala Defaults: Blank City)
  const [formData, setFormData] = useState({
    code: `SBG-C${100 + customers.length + 1}`,
    name: '',
    phone: '',
    email: '',
    city: '',
    gstin: '',
    openingWT: 0,
    openingMC: 0,
    openingLedgerMC: 0,
    status: 'ACTIVE' as const,
  });

  // Dynamically extract unique cities from customers
  const availableCities = Array.from(
    new Set(customers.map((c) => c.city?.trim()).filter(Boolean))
  ) as string[];

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

    const matchesLedger =
      ledgerFilter === 'ALL' ||
      (ledgerFilter === 'GOLD_DUE' && c.currentWT > 0) ||
      (ledgerFilter === 'GOLD_ADV' && c.currentWT < 0) ||
      (ledgerFilter === 'MC_DUE' && c.currentMC > 0) ||
      (ledgerFilter === 'MC_ADV' && c.currentMC < 0) ||
      (ledgerFilter === 'SETTLED' && c.currentWT === 0 && c.currentMC === 0);

    return matchesSearch && matchesStatus && matchesCity && matchesLedger;
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
      openingLedgerMC: Number(formData.openingLedgerMC) || 0,
      status: formData.status,
    });

    setIsModalOpen(false);
    setFormData({
      code: `SBG-C${100 + customers.length + 2}`,
      name: '',
      phone: '',
      email: '',
      city: '',
      gstin: '',
      openingWT: 0,
      openingMC: 0,
      openingLedgerMC: 0,
      status: 'ACTIVE',
    });
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      city: customer.city || '',
      gstin: customer.gstin || '',
      status: customer.status,
    });
    setActiveMenuCustId(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editFormData.name) return;

    await updateCustomer(editingCustomer.id, {
      name: editFormData.name,
      phone: editFormData.phone,
      email: editFormData.email,
      city: editFormData.city,
      gstin: editFormData.gstin,
      status: editFormData.status,
    });

    setIsEditModalOpen(false);
    setEditingCustomer(null);
  };

  const handleToggleStatus = async (customer: Customer) => {
    setActiveMenuCustId(null);
    const newStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updateCustomer(customer.id, { status: newStatus });
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    setActiveMenuCustId(null);
    if (
      window.confirm(
        `Are you sure you want to delete ${customer.name} (${customer.code})?\n\nThis will permanently delete the customer profile and their commercial ledger.`
      )
    ) {
      await deleteCustomer(customer.id);
    }
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#0F5C5B] hover:bg-[#0A4847] text-white font-semibold text-xs shadow-md shadow-[#0F5C5B]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Customer</span>
            </button>
          </div>
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

        {/* Card 3: NET PURE GOLD BALANCE */}
        {(() => {
          const totalGold = customers.reduce((acc, c) => acc + (c.currentWT || 0), 0);
          return (
            <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#EFE5D0] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#7A6D56] uppercase tracking-wider">
                  NET PURE GOLD BALANCE
                </span>
                <div className="w-7 h-7 rounded-lg bg-[#FDF3DE] flex items-center justify-center">
                  <Scale className="w-4 h-4 text-[#C48C2B]" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-[#133837] tracking-tight block">
                  {Math.abs(totalGold).toFixed(3)}g
                </span>
                <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${totalGold >= 0 ? 'text-[#2E8B57]' : 'text-[#B45309]'}`}>
                  <span>●</span> {totalGold >= 0 ? 'Net Due to SBG' : 'Net Advance from Clients'}
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
            <option value="ALL">All Cities ({availableCities.length})</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Working Commercial Ledger Balance Filter */}
          <select
            value={ledgerFilter}
            onChange={(e) => setLedgerFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-[#DCE5E3] bg-[#FAF9F6] text-[#173333] font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Balances</option>
            <option value="GOLD_DUE">Gold Due to SBG (&gt; 0g)</option>
            <option value="GOLD_ADV">Gold Advance by Client (&lt; 0g)</option>
            <option value="MC_DUE">MC Due to SBG (&gt; ₹0)</option>
            <option value="MC_ADV">MC Advance by Client (&lt; ₹0)</option>
            <option value="SETTLED">Settled (0g / ₹0)</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setCityFilter('ALL');
              setLedgerFilter('ALL');
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

        {/* View Mode Switching: Table vs Grid */}
        {viewMode === 'list' ? (
          /* Table View */
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full min-w-[760px] text-left text-xs">
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
                  <th className="py-3.5 px-4 text-center">STATUS</th>
                  <th className="py-3.5 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#647777]">
                      <Users className="w-10 h-10 mx-auto text-[#647777]/40 mb-2" />
                      <p className="font-semibold text-sm">No customers in database</p>
                      <p className="text-xs text-[#647777]/70 mt-1">
                        Click &quot;Add New Customer&quot; to create your first customer profile.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
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
                            {cust.city || 'Kerala, India'}
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
                          className="py-4 px-4 text-center relative"
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
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActiveMenuCustId(
                                    activeMenuCustId === cust.id ? null : cust.id
                                  )
                                }
                                className="p-1.5 rounded-lg hover:bg-white hover:text-[#173333] transition-colors cursor-pointer"
                                title="Customer Actions"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {activeMenuCustId === cust.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setActiveMenuCustId(null)}
                                  />
                                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white border border-[#DCE5E3] shadow-xl py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      onClick={() => handleOpenEdit(cust)}
                                      className="w-full px-3 py-1.5 text-xs text-[#173333] hover:bg-[#FAF9F6] flex items-center gap-2 font-medium cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-[#0F5C5B]" />
                                      <span>Edit Customer</span>
                                    </button>
                                    <button
                                      onClick={() => handleToggleStatus(cust)}
                                      className="w-full px-3 py-1.5 text-xs text-[#173333] hover:bg-[#FAF9F6] flex items-center gap-2 font-medium cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5 text-amber-600" />
                                      <span>
                                        Mark as {cust.status === 'ACTIVE' ? 'Inactive' : 'Active'}
                                      </span>
                                    </button>
                                    <div className="border-t border-[#EFECE6] my-1" />
                                    <button
                                      onClick={() => handleDeleteCustomer(cust)}
                                      className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete Customer</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards Grid View */
          <div className="p-6">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-[#647777]">
                <Users className="w-10 h-10 mx-auto text-[#647777]/40 mb-2" />
                <p className="font-semibold text-sm">No customers in database</p>
                <p className="text-xs text-[#647777]/70 mt-1">
                  Click &quot;Add New Customer&quot; to create your first customer profile.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCustomers.map((cust) => {
                  const isSelected = selectedIds.includes(cust.id);

                  return (
                    <div
                      key={cust.id}
                      onClick={() => onNavigate('customer-profile', cust.id)}
                      className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer p-5 bg-white hover:shadow-md hover:border-[#0F5C5B]/40 flex flex-col justify-between ${
                        isSelected ? 'border-[#0F5C5B] ring-2 ring-[#0F5C5B]/20 bg-[#FAF9F6]' : 'border-[#E2E8E6]'
                      }`}
                    >
                      {/* Top Header */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F5C5B] to-[#174847] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                              {cust.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-[#173333] group-hover:text-[#0F5C5B] transition-colors leading-tight">
                                {cust.name}
                              </h3>
                              <p className="text-[11px] text-[#647777] mt-0.5">
                                {cust.city || 'Kerala, India'}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                              cust.status === 'ACTIVE'
                                ? 'bg-[#E6F8F2] text-[#1A825B]'
                                : 'bg-[#FEECEC] text-[#C24141]'
                            }`}
                          >
                            {cust.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Customer Code Pill */}
                        <div className="flex items-center gap-2 mt-3.5">
                          <span className="font-mono text-[10px] font-bold text-[#7A6126] bg-[#FAF3E0] px-2 py-0.5 rounded-md border border-[#F0E2BE]">
                            {cust.code}
                          </span>
                        </div>

                        {/* Balances Grid */}
                        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-[#EFECE6]">
                          <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EFECE6]">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A8A88] block">
                              Pure Gold (g)
                            </span>
                            <span
                              className={`font-mono font-bold text-sm block mt-0.5 ${
                                cust.currentWT < 0
                                  ? 'text-[#C24141]'
                                  : cust.currentWT > 0
                                  ? 'text-[#1B7C5A]'
                                  : 'text-[#647777]'
                              }`}
                            >
                              {cust.currentWT.toFixed(3)} g
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EFECE6]">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A8A88] block">
                              Making Charge (₹)
                            </span>
                            <span
                              className={`font-mono font-bold text-sm block mt-0.5 ${
                                cust.currentMC < 0
                                  ? 'text-[#C24141]'
                                  : cust.currentMC > 0
                                  ? 'text-[#1B7C5A]'
                                  : 'text-[#173333]'
                              }`}
                            >
                              ₹{cust.currentMC.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('customer-profile', cust.id);
                          }}
                          className="text-[#0F5C5B] font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTxCustId(cust.id);
                              setIsTxModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#0F5C5B]/10 hover:bg-[#0F5C5B] hover:text-white text-[#0F5C5B] font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            + Transact
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuCustId(
                                  activeMenuCustId === `grid-${cust.id}` ? null : `grid-${cust.id}`
                                )
                              }
                              className="p-1 rounded-lg hover:bg-white hover:text-[#173333] text-[#647777] transition-colors cursor-pointer"
                              title="Customer Options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeMenuCustId === `grid-${cust.id}` && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setActiveMenuCustId(null)}
                                />
                                <div className="absolute right-0 bottom-full mb-1 w-44 rounded-xl bg-white border border-[#DCE5E3] shadow-xl py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    onClick={() => handleOpenEdit(cust)}
                                    className="w-full px-3 py-1.5 text-xs text-[#173333] hover:bg-[#FAF9F6] flex items-center gap-2 font-medium cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[#0F5C5B]" />
                                    <span>Edit Customer</span>
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(cust)}
                                    className="w-full px-3 py-1.5 text-xs text-[#173333] hover:bg-[#FAF9F6] flex items-center gap-2 font-medium cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5 text-amber-600" />
                                    <span>
                                      Mark as {cust.status === 'ACTIVE' ? 'Inactive' : 'Active'}
                                    </span>
                                  </button>
                                  <div className="border-t border-[#EFECE6] my-1" />
                                  <button
                                    onClick={() => handleDeleteCustomer(cust)}
                                    className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Customer</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
              placeholder="e.g. Ernakulam, Kerala"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <SBGInput
              label="GSTIN / Tax ID"
              placeholder="e.g. 32AAAAA0000A1Z5"
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
            <SBGInput
              label="Opening Ledger Balance (₹)"
              type="number"
              step="0.01"
              suffixText="INR"
              value={formData.openingLedgerMC}
              onChange={(e) => setFormData({ ...formData, openingLedgerMC: parseFloat(e.target.value) || 0 })}
              helperText="Cash Ledger initial running balance"
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

      {/* Edit Customer Modal */}
      <SBGModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCustomer(null);
        }}
        title={`Edit Customer — ${editingCustomer?.name || ''}`}
        size="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SBGInput
              label="Customer / Company Name"
              placeholder="e.g. Navratan Jewellers Pvt Ltd"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
            <SBGInput
              label="Contact Phone"
              placeholder="+91 98XXX XXXXX"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              required
            />
            <SBGInput
              label="Email Address"
              placeholder="accounts@jeweller.com"
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            />
            <SBGInput
              label="City & State"
              placeholder="e.g. Ernakulam, Kerala"
              value={editFormData.city}
              onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
            />
            <SBGInput
              label="GSTIN / Tax ID"
              placeholder="e.g. 32AAAAA0000A1Z5"
              value={editFormData.gstin}
              onChange={(e) => setEditFormData({ ...editFormData, gstin: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-[#2C3E3D] uppercase tracking-wider mb-1.5">
                Account Status
              </label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#DCE5E3] rounded-xl text-sm font-medium text-[#1A2E2C] focus:outline-none focus:ring-2 focus:ring-[#0B4E48]/20 focus:border-[#0B4E48] transition-all"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#DCE5E3] flex justify-end gap-3">
            <SBGButton
              variant="outline"
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingCustomer(null);
              }}
            >
              Cancel
            </SBGButton>
            <SBGButton variant="primary" type="submit">
              Save Changes
            </SBGButton>
          </div>
        </form>
      </SBGModal>

      {/* Transaction Modal (Purchase/Sale Cost Sheet or Gold/Cash Receipt/Payment) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        defaultCustomerId={selectedTxCustId}
        onNavigate={onNavigate}
        onSuccess={(targetId) => onNavigate('customer-profile', targetId)}
      />
    </div>
  );
};
