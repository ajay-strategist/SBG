import React, { useState, useEffect } from 'react';
import { useSBG } from '../../store/sbgStore';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  BookOpen,
  FileSpreadsheet,
  Coins,
  FileBarChart2,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Settings,
  Search,
  Bell,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  PlusCircle,
  Gem,
  TrendingUp,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'customers'
  | 'customer-profile'
  | 'orders'
  | 'order-details'
  | 'ledger'
  | 'new-transaction'
  | 'estimates'
  | 'new-estimate'
  | 'estimate-details'
  | 'settlements'
  | 'new-settlement'
  | 'reports'
  | 'erp'
  | 'audit'
  | 'users'
  | 'settings';

interface AppShellProps {
  currentTab: ActiveTab;
  onNavigate: (tab: ActiveTab, entityId?: string) => void;
  selectedEntityId?: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onNavigate,
  children,
}) => {
  const {
    currentUser,
    logout,
    switchUserRole,
    availableUsers,
    goldMarketRate,
    setGoldMarketRate,
    lastRateUpdate,
  } = useSBG();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sbg_sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(goldMarketRate.toString());
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sbg_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers' as ActiveTab, label: 'Customers', icon: Users },
    { id: 'orders' as ActiveTab, label: 'Orders', icon: ShoppingBag },
    { id: 'ledger' as ActiveTab, label: 'Customer Ledger', icon: BookOpen },
    { id: 'estimates' as ActiveTab, label: 'SBG Estimates', icon: FileSpreadsheet },
    { id: 'settlements' as ActiveTab, label: 'Settlements', icon: Coins },
    { id: 'reports' as ActiveTab, label: 'Reports', icon: FileBarChart2 },
    { id: 'erp' as ActiveTab, label: 'ERP Reconciliation', icon: RefreshCw },
    { id: 'audit' as ActiveTab, label: 'Audit & Security', icon: ShieldCheck },
    { id: 'users' as ActiveTab, label: 'Users & Access', icon: UserCheck },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  const handleRateSave = () => {
    const val = parseFloat(tempRate);
    if (!isNaN(val) && val > 0) {
      setGoldMarketRate(val);
    }
    setIsEditingRate(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F6F4EE] text-[#173333] font-sans antialiased">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#093E3C] text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D9B76C] to-[#B8923F] flex items-center justify-center text-[#093E3C] font-black text-sm shadow-sm">
            <Gem className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-cinzel font-bold tracking-wider text-sm block">SBG ERP</span>
            <span className="text-[9px] text-[#E7CCA0] tracking-widest uppercase">Jewellery Suite</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-white/10 text-white cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Left Sidebar (Emerald Gradient & Gold Accents) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 bg-gradient-to-b from-[#093E3C] via-[#073331] to-[#052524] text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out lg:static ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b border-white/10 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D9B76C] via-[#F4E8C8] to-[#C7A250] flex items-center justify-center shadow-md shrink-0">
              <Gem className="w-6 h-6 text-[#073331]" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-cinzel font-bold text-lg tracking-wide text-white">SBG</h1>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#D9B76C]/25 text-[#E7CCA0] border border-[#D9B76C]/40">
                    ERP
                  </span>
                </div>
                <p className="text-[9px] text-[#D9B76C] font-medium tracking-wider uppercase whitespace-nowrap">
                  Jewellery Suite
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button */}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              title="Hide / Collapse Panel"
              className="hidden lg:flex p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#A0C5C3] hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Quick Button */}
        {sidebarCollapsed && (
          <div className="hidden lg:flex justify-center my-2">
            <button
              onClick={() => setSidebarCollapsed(false)}
              title="Expand Panel"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#D9B76C] hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Market Gold Rate Luxury Card */}
        {!sidebarCollapsed ? (
          <div className="mx-3.5 my-3 p-3.5 rounded-2xl bg-white/10 border border-[#D9B76C]/30 backdrop-blur-md relative overflow-hidden shadow-lg animate-fadeIn">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#E7CCA0] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#D9B76C]" /> Market Gold Rate
                </span>
                <button
                  onClick={() => {
                    setTempRate(goldMarketRate.toString());
                    setIsEditingRate(!isEditingRate);
                  }}
                  className="text-[10px] text-white/70 hover:text-[#E7CCA0] underline cursor-pointer"
                >
                  {isEditingRate ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {isEditingRate ? (
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="number"
                    step="0.01"
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg bg-white text-[#173333] font-mono font-bold focus:outline-none"
                  />
                  <button
                    onClick={handleRateSave}
                    className="px-2.5 py-1.5 rounded-lg bg-[#D9B76C] text-[#093E3C] font-bold text-xs hover:bg-[#E7CCA0] cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-mono font-bold text-white tracking-tight">
                      ₹ {goldMarketRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#D9B76C]/20 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-[#D9B76C]" />
                    </div>
                  </div>
                  <div className="text-[10px] text-white/60 mt-0.5">per gram (99.5)</div>

                  {/* 3D Gold Bars Decorative Graphic */}
                  <div className="flex items-end justify-between mt-2 pt-2 border-t border-white/10">
                    <div className="text-[9px] text-white/50">
                      <span className="block">Last Updated</span>
                      <span className="text-white/80 font-medium">{lastRateUpdate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2.5 bg-gradient-to-r from-[#D9B76C] to-[#C49E4B] rounded-xs shadow-xs border border-white/30" />
                      <div className="w-5 h-3 bg-gradient-to-r from-[#F4E8C8] to-[#D9B76C] rounded-xs shadow-sm border border-white/40" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center my-2 p-2 mx-2 bg-white/10 rounded-xl border border-[#D9B76C]/30 text-center" title={`Gold Rate: ₹${goldMarketRate.toLocaleString('en-IN')} /g`}>
            <Sparkles className="w-4 h-4 text-[#D9B76C] mb-1" />
            <span className="text-[9px] font-mono font-bold text-[#E7CCA0]">₹{(goldMarketRate/1000).toFixed(1)}k</span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-2.5 py-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentTab === item.id ||
              (item.id === 'customers' && currentTab === 'customer-profile') ||
              (item.id === 'orders' && currentTab === 'order-details') ||
              (item.id === 'ledger' && currentTab === 'new-transaction') ||
              (item.id === 'estimates' && (currentTab === 'new-estimate' || currentTab === 'estimate-details')) ||
              (item.id === 'settlements' && currentTab === 'new-settlement');

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  sidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3.5 py-2.5'
                } rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#E7CCA0] text-[#0A3D3C] shadow-md font-bold'
                    : 'text-[#A0C5C3] hover:text-white hover:bg-white/8 font-medium'
                }`}
              >
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0A3D3C]' : 'text-[#A0C5C3]'}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
                {!sidebarCollapsed && (
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-[#0A3D3C]' : 'text-white/30'}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Slogan Banner in Sidebar (Expanded only) */}
        {!sidebarCollapsed && (
          <div className="mx-3.5 my-2 p-3 rounded-xl bg-black/20 border border-white/10 text-left animate-fadeIn">
            <p className="text-[10px] font-serif italic text-[#E7CCA0] leading-tight">
              Trusted Numbers
            </p>
            <p className="text-[10px] text-white/80 font-sans font-medium">
              Stronger Relationships
            </p>
          </div>
        )}

        {/* Active User Profile Footer */}
        <div className="p-3 border-t border-white/10 bg-black/25 relative">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2.5 flex-1 min-w-0'} cursor-pointer`}
              title={sidebarCollapsed ? `${currentUser.name} (${currentUser.role})` : undefined}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0"
                style={{ backgroundColor: currentUser.avatarColor || '#0F5C5B' }}
              >
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)}
              </div>
              {!sidebarCollapsed && (
                <div className="truncate text-left">
                  <span className="text-xs font-bold text-white block truncate leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-[#E7CCA0] font-medium block">
                    ({currentUser.role})
                  </span>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* User switcher dropdown */}
          {userDropdownOpen && (
            <div className={`absolute bottom-full ${sidebarCollapsed ? 'left-2 w-56' : 'left-3.5 right-3.5'} mb-2 bg-[#062A29] border border-white/20 rounded-xl p-2 shadow-2xl z-50 animate-fadeIn`}>
              <div className="text-[9px] uppercase tracking-wider text-[#E7CCA0] font-bold px-2 py-1">
                Switch Role Profile
              </div>
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUserRole(u.role);
                    setUserDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    currentUser.role === u.role
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{u.name}</span>
                  <span className="text-[9px] text-[#E7CCA0] uppercase">({u.role})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Navbar */}
        <header className="no-print sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-[#DCE5E3] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 sm:gap-4 shadow-xs">
          {/* Left: Sidebar Toggle Button + Search Pill Input */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand Navigation Panel' : 'Hide / Collapse Panel'}
              className="hidden lg:flex p-2 rounded-xl border border-[#DCE5E3] text-[#173333] hover:text-[#0F5C5B] hover:bg-[#F2FAF8] transition-colors cursor-pointer bg-white shadow-xs"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[#647777] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customers, orders, transactions, estimates, ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B] placeholder-[#647777]/60 shadow-xs"
              />
            </div>
          </div>

          {/* Quick Action Pills & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* New Transaction Action Pill */}
            <button
              onClick={() => onNavigate('new-transaction')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F5C5B] hover:bg-[#0A4847] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Transaction</span>
            </button>

            {/* New Estimate Action Pill */}
            <button
              onClick={() => onNavigate('new-estimate')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E5C378] hover:bg-[#D9B76C] text-[#3D2D0C] font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#3D2D0C]" />
              <span>New Estimate</span>
            </button>

            {/* Notification Bell with Badge 3 */}
            <button
              onClick={() => onNavigate('audit')}
              className="relative p-2.5 rounded-full border border-[#DCE5E3] text-[#647777] hover:text-[#0F5C5B] hover:bg-white transition-colors cursor-pointer bg-white shadow-xs"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                3
              </span>
            </button>

            {/* User Profile Pill */}
            <div
              onClick={() => onNavigate('users')}
              className="flex items-center gap-2.5 pl-2 cursor-pointer hover:opacity-90 transition-opacity bg-white px-3 py-1.5 rounded-full border border-[#DCE5E3] shadow-xs"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs bg-[#0F5C5B]"
              >
                {currentUser.name[0]}
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-[#173333] block leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[9px] font-semibold text-[#647777] uppercase tracking-wider block">
                  {currentUser.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#647777] hidden md:block" />
            </div>
          </div>
        </header>

        {/* View Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1520px] w-full mx-auto animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
};

