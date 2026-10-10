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
  CheckCircle2,
  Check,
} from 'lucide-react';
import { TransactionModal } from '../ui/TransactionModal';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'rate' | 'audit' | 'transaction';
}

const defaultNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Market Gold Rate Updated',
    desc: 'Fine Gold 99.5 rate updated to ₹12,889.30/g',
    time: '10m ago',
    read: true,
    type: 'rate',
  },
  {
    id: 'n2',
    title: 'New Transaction Confirmed',
    desc: 'Customer TIKVAH ledger updated with new entry',
    time: '1h ago',
    read: true,
    type: 'transaction',
  },
  {
    id: 'n3',
    title: 'Audit Log Recorded',
    desc: 'Security event verified in immutable audit trail',
    time: '2h ago',
    read: true,
    type: 'audit',
  },
];

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
  | 'edit-estimate'
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
    selectedPurity,
    setSelectedPurity,
    goldRate24hChange,
    isGoldRateLive,
    refreshLiveGoldRate,
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
  const [isTxDropdownOpen, setIsTxDropdownOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('sbg_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clear any old stuck notifications so badge is 0
          return parsed.map((item: NotificationItem) => ({ ...item, read: true }));
        }
      }
    } catch (e) {}
    return defaultNotifications;
  });
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sbg_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // When user checks Audit & Security tab, ensure notifications are marked as read
  useEffect(() => {
    if (currentTab === 'audit') {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [currentTab]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggleNotifications = () => {
    const willOpen = !isNotifOpen;
    setIsNotifOpen(willOpen);
    if (willOpen) {
      // Clear badge count immediately when checked
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    localStorage.setItem('sbg_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const allNavItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers' as ActiveTab, label: 'Customers', icon: Users },
    { id: 'estimates' as ActiveTab, label: 'SBG Estimates', icon: FileSpreadsheet },
    { id: 'audit' as ActiveTab, label: 'Audit & Security', icon: ShieldCheck },
    { id: 'users' as ActiveTab, label: 'Users & Access', icon: UserCheck },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  const navItems = allNavItems.filter((item) => {
    if (currentUser?.role === 'CLIENT' || currentUser?.role === 'STAFF') {
      return ['dashboard', 'customers', 'estimates'].includes(item.id);
    }
    return true;
  });

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
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src="/sbg-logo.png" alt="Sree Balaji Gold" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-cinzel font-bold tracking-wider text-sm block">SBG ERP</span>
            <span className="text-[9px] text-[#E7CCA0] tracking-widest uppercase">Sree Balaji Gold</span>
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
        className={`fixed inset-y-0 left-0 z-30 bg-gradient-to-b from-[#093E3C] via-[#073331] to-[#052524] text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b border-white/10 shrink-0 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <img src="/sbg-logo.png" alt="Sree Balaji Gold" className="w-full h-full object-contain" />
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
                  Sree Balaji Gold
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
          <div className="hidden lg:flex justify-center my-2 shrink-0">
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
          <div className="mx-3.5 my-3 p-3.5 rounded-2xl bg-white/10 border border-[#D9B76C]/30 backdrop-blur-md relative overflow-hidden shadow-lg animate-fadeIn shrink-0">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#E7CCA0] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#D9B76C]" /> MARKET GOLD RATE
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshLiveGoldRate}
                    className="text-[10px] text-white/60 hover:text-[#E7CCA0] cursor-pointer"
                    title="Refresh Live Rate"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
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
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${goldRate24hChange >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {goldRate24hChange >= 0 ? `+${goldRate24hChange}%` : `${goldRate24hChange}%`}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#D9B76C]/20 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-[#D9B76C]" />
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/60 mt-0.5 flex items-center justify-between">
                    <span>per gram ({selectedPurity === '995' ? '99.5' : '91.6 / 22K'})</span>
                    {isGoldRateLive && (
                      <span className="inline-flex items-center gap-1 text-[9px] text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live
                      </span>
                    )}
                  </div>

                  {/* Interactive Purity Toggles */}
                  <div className="flex items-end justify-between mt-2 pt-2 border-t border-white/10">
                    <div className="text-[9px] text-white/50">
                      <span className="block">Last Updated</span>
                      <span className="text-white/80 font-medium">{lastRateUpdate}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedPurity('995')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          selectedPurity === '995'
                            ? 'bg-[#D9B76C] text-[#093E3C] border-[#D9B76C]'
                            : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                        }`}
                        title="Fine Gold 99.5 Rate"
                      >
                        99.5
                      </button>
                      <button
                        onClick={() => setSelectedPurity('916')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          selectedPurity === '916'
                            ? 'bg-[#D9B76C] text-[#093E3C] border-[#D9B76C]'
                            : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                        }`}
                        title="Jewelry 91.6 (22K) Rate"
                      >
                        91.6
                      </button>
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
          <div className="mx-3.5 my-2 p-3 rounded-xl bg-black/20 border border-white/10 text-left animate-fadeIn shrink-0">
            <p className="text-[10px] font-serif italic text-[#E7CCA0] leading-tight">
              Trusted Numbers
            </p>
            <p className="text-[10px] text-white/80 font-sans font-medium">
              Stronger Relationships
            </p>
          </div>
        )}

        {/* Active User Profile Footer */}
        <div className="p-3 border-t border-white/10 bg-black/25 relative shrink-0">
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
          {/* Left: Search Pill Input */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
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
            {/* New Transaction Action Pill with Purchase / Sale / Settlement Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsTxDropdownOpen((prev) => !prev)}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F5C5B] hover:bg-[#0A4847] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                title="New Transaction Menu"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Transaction</span>
                <ChevronDown className="w-3 h-3 text-white/70 ml-0.5" />
              </button>

              {isTxDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsTxDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#DCE5E3] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#647777] border-b border-[#EFECE6]">
                      Choose Transaction Type
                    </div>

                    {/* Sale -> Go to Estimate */}
                    <button
                      onClick={() => {
                        setIsTxDropdownOpen(false);
                        onNavigate('new-estimate', 'SALE');
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-[#0F5C5B]/5 flex items-center gap-3 transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                        💎
                      </div>
                      <div>
                        <div className="font-bold text-[#173333] group-hover:text-[#0F5C5B]">
                          Sale (Estimate Sheet)
                        </div>
                        <div className="text-[10px] text-[#647777]">
                          Client ornaments delivery & invoice
                        </div>
                      </div>
                    </button>

                    {/* Purchase -> Go to Estimate */}
                    <button
                      onClick={() => {
                        setIsTxDropdownOpen(false);
                        onNavigate('new-estimate', 'PURCHASE');
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-[#0F5C5B]/5 flex items-center gap-3 transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                        📦
                      </div>
                      <div>
                        <div className="font-bold text-[#173333] group-hover:text-[#0F5C5B]">
                          Purchase (Estimate Sheet)
                        </div>
                        <div className="text-[10px] text-[#647777]">
                          Old gold receipt & raw casting purchase
                        </div>
                      </div>
                    </button>

                    {/* Payment -> Opens Record Customer Transaction Modal (Gold & Cash) */}
                    <button
                      onClick={() => {
                        setIsTxDropdownOpen(false);
                        setIsPaymentModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-[#0F5C5B]/5 flex items-center gap-3 transition-colors cursor-pointer group border-t border-[#EFECE6]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                        🪙
                      </div>
                      <div>
                        <div className="font-bold text-[#173333] group-hover:text-[#0F5C5B]">
                          Payment (Gold & Cash)
                        </div>
                        <div className="text-[10px] text-[#647777]">
                          Record customer payment & update ledger
                        </div>
                      </div>
                    </button>

                    {/* Account Settlement */}
                    <button
                      onClick={() => {
                        setIsTxDropdownOpen(false);
                        onNavigate('new-settlement');
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-[#0F5C5B]/5 flex items-center gap-3 transition-colors cursor-pointer group border-t border-[#EFECE6]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                        📑
                      </div>
                      <div>
                        <div className="font-bold text-[#173333] group-hover:text-[#0F5C5B]">
                          Account Settlement
                        </div>
                        <div className="text-[10px] text-[#647777]">
                          Full settlement statement & vouchers
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Notification Bell with Dynamic Clearable Badge */}
            <div className="relative">
              <button
                onClick={handleToggleNotifications}
                className="relative p-2.5 rounded-full border border-[#DCE5E3] text-[#647777] hover:text-[#0F5C5B] hover:bg-white transition-colors cursor-pointer bg-white shadow-xs"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotifOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-[#DCE5E3] shadow-xl py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 pb-2.5 border-b border-[#EFECE6] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#173333]">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearAllNotifications}
                            className="text-[10px] font-semibold text-[#647777] hover:text-red-600 transition-colors cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-[#EFECE6]/60">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#647777]">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                          <p className="font-bold text-[#173333]">All caught up!</p>
                          <p className="text-[11px] text-[#647777] mt-0.5">No notifications pending</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3.5 hover:bg-gray-50/80 transition-colors flex items-start gap-3 cursor-pointer ${
                              !notif.read ? 'bg-[#0F5C5B]/5' : ''
                            }`}
                            onClick={() => {
                              setIsNotifOpen(false);
                              onNavigate('audit');
                            }}
                          >
                            <div className="w-8 h-8 rounded-xl bg-[#0F5C5B]/10 text-[#0F5C5B] flex items-center justify-center text-xs shrink-0 font-bold">
                              {notif.type === 'rate' ? '🪙' : notif.type === 'transaction' ? '💎' : '🛡️'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-[#173333] truncate">
                                  {notif.title}
                                </h4>
                                <span className="text-[9px] text-[#647777] shrink-0 ml-1">
                                  {notif.time}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#647777] mt-0.5 line-clamp-2 leading-relaxed">
                                {notif.desc}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="px-4 pt-2.5 border-t border-[#EFECE6] flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          onNavigate('audit');
                        }}
                        className="text-[11px] font-bold text-[#0F5C5B] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Security Audit Logs</span>
                        <span>➔</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

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

      {/* Payment / Receipt Modal (Record Customer Transaction) */}
      <TransactionModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        initialMode="RECEIPT_PAYMENT"
        onNavigate={onNavigate}
      />
    </div>
  );
};

