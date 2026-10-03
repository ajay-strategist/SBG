import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Customer,
  Order,
  LedgerTransaction,
  EstimateCostSheet,
  SettlementRecord,
  AuditLogEntry,
  UserAccount,
  calculateNetWT,
  calculatePureWT,
  calculateTotalAmount,
  calculateRunningBalances,
  calculateSettlement,
  calculateCustomerSummaryBalances,
} from '../core/calculations';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchLiveGoldRate, GoldRateData } from '../lib/goldRateService';

export interface ERPCommercialSyncItem {
  id: string;
  erpRef: string;
  sbgRef?: string;
  customerId: string;
  customerName: string;
  date: string;
  erpGrossWT: number;
  sbgGrossWT: number;
  erpMC: number;
  sbgMC: number;
  status: 'MATCHED' | 'DISCREPANCY' | 'PENDING_SBG_ENTRY';
  discrepancyReason?: string;
}

interface SBGContextType {
  // Auth
  isAuthenticated: boolean;
  login: (username?: string, password?: string) => boolean;
  logout: () => void;
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  availableUsers: UserAccount[];
  switchUserRole: (role: UserAccount['role']) => void;
  addUser: (user: Omit<UserAccount, 'id'>) => UserAccount;
  updateUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;

  // Loading & Sync Status
  isLoading: boolean;
  syncStatus: 'SYNCED' | 'SYNCING' | 'OFFLINE';

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'currentWT' | 'currentMC'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;

  // Orders
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'currentWT' | 'currentMC'>) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  getOrder: (id: string) => Order | undefined;

  // Ledger Transactions
  transactions: LedgerTransaction[];
  addTransaction: (tx: Omit<LedgerTransaction, 'id' | 'createdAt' | 'updatedAt' | 'balanceWT' | 'balanceMC'>) => Promise<LedgerTransaction>;
  updateTransaction: (id: string, updates: Partial<LedgerTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  importCustomerTransactions: (
    customerId: string,
    txs: Omit<LedgerTransaction, 'id' | 'createdAt' | 'updatedAt' | 'balanceWT' | 'balanceMC'>[],
    replaceExisting?: boolean
  ) => Promise<void>;
  getCustomerTransactions: (customerId: string) => LedgerTransaction[];
  getOrderTransactions: (orderId: string) => LedgerTransaction[];

  // Estimates
  estimates: EstimateCostSheet[];
  addEstimate: (estimate: EstimateCostSheet) => Promise<void>;
  updateEstimate: (id: string, updates: Partial<EstimateCostSheet>) => Promise<void>;
  deleteEstimate: (id: string) => Promise<void>;
  getEstimate: (id: string) => EstimateCostSheet | undefined;

  // Settlements
  settlements: SettlementRecord[];
  addSettlement: (input: {
    customerId: string;
    orderId?: string;
    settlementType: 'GOLD_ONLY' | 'CASH_ONLY' | 'GOLD_AND_CASH';
    goldReceived: number;
    cashReceived: number;
    agreedGoldRate: number;
    notes?: string;
  }) => Promise<SettlementRecord>;

  // ERP Reconciliation
  erpSyncItems: ERPCommercialSyncItem[];
  resolveDiscrepancy: (id: string, resolutionNotes: string) => void;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  logAudit: (action: string, module: AuditLogEntry['module'], recordId: string, details?: string, prev?: any, next?: any) => void;

  // System Settings & Realtime Gold Rate
  goldMarketRate: number;
  rate24k: number;
  rate995: number;
  rate916: number;
  selectedPurity: '995' | '916';
  setSelectedPurity: (purity: '995' | '916') => void;
  goldRate24hChange: number;
  goldRateSource: string;
  isGoldRateLive: boolean;
  refreshLiveGoldRate: () => Promise<void>;
  setGoldMarketRate: (rate: number) => void;
  defaultGSTRate: number;
  setDefaultGSTRate: (rate: number) => void;
  lastRateUpdate: string;
  refreshFromDatabase: () => Promise<void>;
  clearAllData: () => void;
}

const defaultUsers: UserAccount[] = [
  {
    id: 'usr-1',
    username: 'admin',
    name: 'Rajesh Mehra',
    email: 'rajesh@sbgjewels.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    password: 'password',
    avatarColor: '#0F5C5B',
    permissions: {
      customers: true,
      orders: true,
      transactions: true,
      estimates: true,
      settlements: true,
      reports: true,
      users: true,
      erp: false,
    },
  },
  {
    id: 'usr-2',
    username: 'staff',
    name: 'Sunita Sharma',
    email: 'sunita@sbgjewels.com',
    role: 'STAFF',
    status: 'ACTIVE',
    password: 'password',
    avatarColor: '#23827F',
    permissions: {
      customers: true,
      orders: true,
      transactions: true,
      estimates: true,
      settlements: true,
      reports: true,
      users: false,
      erp: false,
    },
  },
  {
    id: 'usr-3',
    username: 'client',
    name: 'Vikram Sethi',
    email: 'vikram@sbgjewels.com',
    role: 'CLIENT',
    status: 'ACTIVE',
    password: 'password',
    avatarColor: '#D9B76C',
    customerId: 'cust-101',
    permissions: {
      customers: true,
      orders: true,
      transactions: true,
      estimates: true,
      settlements: false,
      reports: false,
      users: false,
      erp: false,
    },
  },
];

const SBGContext = createContext<SBGContextType | null>(null);

export const SBGProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('sbg_auth');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [availableUsers, setAvailableUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('sbg_users');
    return saved ? JSON.parse(saved) : defaultUsers;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('sbg_user');
    return saved ? JSON.parse(saved) : defaultUsers[0];
  });

  useEffect(() => {
    localStorage.setItem('sbg_users', JSON.stringify(availableUsers));
  }, [availableUsers]);

  const addUser = (userData: Omit<UserAccount, 'id'>): UserAccount => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      password: userData.password || 'password',
      avatarColor: userData.avatarColor || (userData.role === 'ADMIN' ? '#0F5C5B' : userData.role === 'STAFF' ? '#23827F' : '#D9B76C'),
    };
    setAvailableUsers((prev) => [...prev, newUser]);
    logAudit('CREATE_USER', 'USERS', newUser.id, `Created user ${newUser.name} (${newUser.role})`);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setAvailableUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
    logAudit('UPDATE_USER', 'USERS', id, `Updated user ${id}`);
  };

  const deleteUser = (id: string) => {
    setAvailableUsers((prev) => prev.filter((u) => u.id !== id));
    logAudit('DELETE_USER', 'USERS', id, `Deleted user ${id}`);
  };

  // Initial Default Customer Data from Google Sheet Ledger (TIKVAH)
  const defaultCustomersList: Customer[] = [
    {
      id: 'cust-tikvah',
      code: 'SBG-C101',
      name: 'TIKVAH',
      phone: '+91 98200 12345',
      email: 'tikvah@sbgjewels.com',
      address: 'Zaveri Bazaar',
      city: 'Mumbai, Maharashtra',
      gstin: '27AAAAA0000A1Z5',
      openingWT: 0,
      openingMC: 0,
      currentWT: 4.328,
      currentMC: -5263.51,
      status: 'ACTIVE',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-09-11T00:00:00.000Z',
    },
  ];

  const defaultTransactionsList: LedgerTransaction[] = [
    {
      id: 'tx-tikvah-1',
      customerId: 'cust-tikvah',
      date: '2026-05-29',
      direction: 'RECEIPT',
      particulars: 'PURCHASE',
      description: 'RD/BB/031/26-27',
      nos: 50,
      grossWT: 23.085,
      stoneWT: 1.478,
      netWT: -21.607,
      touch: 76.0,
      pureWT: -16.421,
      stoneAmount: 222583,
      stoneAmountCal: -222583,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: -222583,
      balanceWT: -16.421,
      balanceMC: -222583,
      status: 'CONFIRMED',
      createdAt: '2026-05-29T10:00:00.000Z',
      updatedAt: '2026-05-29T10:00:00.000Z',
    },
    {
      id: 'tx-tikvah-2',
      customerId: 'cust-tikvah',
      date: '2026-06-03',
      direction: 'ISSUE',
      particulars: 'PR',
      description: 'DN/003/26-27',
      nos: 1,
      grossWT: 0.344,
      stoneWT: 0.012,
      netWT: 0.332,
      touch: 76.0,
      pureWT: 0.252,
      stoneAmount: 4063,
      stoneAmountCal: 4063,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: 4063,
      balanceWT: -16.169,
      balanceMC: -218520,
      status: 'CONFIRMED',
      createdAt: '2026-06-03T10:00:00.000Z',
      updatedAt: '2026-06-03T10:00:00.000Z',
    },
    {
      id: 'tx-tikvah-3',
      customerId: 'cust-tikvah',
      date: '2026-06-03',
      direction: 'ISSUE',
      particulars: 'SALE',
      description: 'SBG/BB/047',
      nos: 0,
      grossWT: 16.51,
      stoneWT: 0,
      netWT: 16.51,
      touch: 99.9,
      pureWT: 16.493,
      stoneAmount: 0,
      stoneAmountCal: 0,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: 0,
      balanceWT: 0.324,
      balanceMC: -218520,
      status: 'CONFIRMED',
      createdAt: '2026-06-03T11:00:00.000Z',
      updatedAt: '2026-06-03T11:00:00.000Z',
    },
    {
      id: 'tx-tikvah-4',
      customerId: 'cust-tikvah',
      date: '2026-06-10',
      direction: 'ISSUE',
      particulars: 'PAYMENT_RECEIVED',
      description: 'PAYMENT',
      nos: 0,
      grossWT: 0,
      stoneWT: 0,
      netWT: 0,
      touch: 0,
      pureWT: 0,
      stoneAmount: 100000,
      stoneAmountCal: 100000,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: 100000,
      balanceWT: 0.324,
      balanceMC: -118520,
      status: 'CONFIRMED',
      createdAt: '2026-06-10T10:00:00.000Z',
      updatedAt: '2026-06-10T10:00:00.000Z',
    },
    {
      id: 'tx-tikvah-5',
      customerId: 'cust-tikvah',
      date: '2026-06-19',
      direction: 'ISSUE',
      particulars: 'PAYMENT_RECEIVED',
      description: 'PAYMENT',
      nos: 0,
      grossWT: 0,
      stoneWT: 0,
      netWT: 0,
      touch: 0,
      pureWT: 0,
      stoneAmount: 112155,
      stoneAmountCal: 112155,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: 112155,
      balanceWT: 0.324,
      balanceMC: -6365,
      status: 'CONFIRMED',
      createdAt: '2026-06-19T10:00:00.000Z',
      updatedAt: '2026-06-19T10:00:00.000Z',
    },
    {
      id: 'tx-tikvah-6',
      customerId: 'cust-tikvah',
      date: '2026-07-07',
      direction: 'ISSUE',
      particulars: 'ISSUE',
      description: 'JWI/148/26-27',
      nos: 1,
      grossWT: 2.036,
      stoneWT: 0.018,
      netWT: 2.018,
      touch: 92.0,
      pureWT: 1.857,
      stoneAmount: 0,
      stoneAmountCal: 0,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: 0,
      balanceWT: 2.181,
      balanceMC: -6365,
      status: 'CONFIRMED',
      createdAt: '2026-07-07T10:00:00.000Z',
      updatedAt: '2026-07-07T10:00:00.000Z',
    },
    {
      id: 'tx-tikvah-7',
      customerId: 'cust-tikvah',
      date: '2026-07-07',
      direction: 'ISSUE',
      particulars: 'ISSUE',
      description: 'JWI/148/26-27',
      nos: 1,
      grossWT: 3.734,
      stoneWT: 0.05,
      netWT: 3.684,
      touch: 75.0,
      pureWT: 2.763,
      stoneAmount: 0,
      stoneAmountCal: 0,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: 0,
      balanceWT: 4.944,
      balanceMC: -6365,
      status: 'CONFIRMED',
      createdAt: '2026-07-07T11:00:00.000Z',
      updatedAt: '2026-07-07T11:00:00.000Z',
    },
    {
      id: 'tx-tikvah-8',
      customerId: 'cust-tikvah',
      date: '2026-08-19',
      direction: 'RECEIPT',
      particulars: 'PURCHASE',
      description: 'RD/BB/087/26-27',
      nos: 2,
      grossWT: 2.225,
      stoneWT: 0.132,
      netWT: -2.093,
      touch: 76.0,
      pureWT: -1.591,
      stoneAmount: 15494,
      stoneAmountCal: -15494,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: -15494,
      balanceWT: 3.353,
      balanceMC: -21859,
      status: 'CONFIRMED',
      createdAt: '2026-08-19T10:00:00.000Z',
      updatedAt: '2026-08-19T10:00:00.000Z',
    },
    {
      id: 'tx-tikvah-9',
      customerId: 'cust-tikvah',
      date: '2026-09-02',
      direction: 'RECEIPT',
      particulars: 'PURCHASE',
      description: 'RD/BB/094/26-27',
      nos: 22,
      grossWT: 18.476,
      stoneWT: 0.906,
      netWT: -17.57,
      touch: 76.0,
      pureWT: -13.353,
      stoneAmount: 128094.51,
      stoneAmountCal: -128094.51,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: -128094.51,
      balanceWT: -10.0,
      balanceMC: -149953.51,
      status: 'CONFIRMED',
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-02T10:00:00.000Z',
    },
    {
      id: 'tx-tikvah-10',
      customerId: 'cust-tikvah',
      date: '2026-09-02',
      direction: 'RECEIPT',
      particulars: 'PURCHASE',
      description: 'RD/BB/097/26-27',
      nos: 0,
      grossWT: 0.1,
      stoneWT: 0,
      netWT: -0.1,
      touch: 76.0,
      pureWT: -0.076,
      stoneAmount: 0,
      stoneAmountCal: 0,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: 0,
      balanceWT: -10.076,
      balanceMC: -149953.51,
      status: 'CONFIRMED',
      createdAt: '2026-09-02T11:00:00.000Z',
      updatedAt: '2026-09-02T11:00:00.000Z',
    },
    {
      id: 'tx-tikvah-11',
      customerId: 'cust-tikvah',
      date: '2026-09-04',
      direction: 'ISSUE',
      particulars: 'SALE',
      description: 'SBG/BB/088/26-27',
      nos: 0,
      grossWT: 14.77,
      stoneWT: 0,
      netWT: 14.77,
      touch: 99.5,
      pureWT: 14.696,
      stoneAmount: 0,
      stoneAmountCal: 0,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: 0,
      balanceWT: 4.62,
      balanceMC: -149953.51,
      status: 'CONFIRMED',
      createdAt: '2026-09-04T10:00:00.000Z',
      updatedAt: '2026-09-04T10:00:00.000Z',
    },
    {
      id: 'tx-tikvah-12',
      customerId: 'cust-tikvah',
      date: '2026-09-05',
      direction: 'ISSUE',
      particulars: 'PAYMENT_RECEIVED',
      description: 'PAYMENT',
      nos: 0,
      grossWT: 0,
      stoneWT: 0,
      netWT: 0,
      touch: 0,
      pureWT: 0,
      stoneAmount: 146223,
      stoneAmountCal: 146223,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: 146223,
      balanceWT: 4.62,
      balanceMC: -3730.51,
      status: 'CONFIRMED',
      createdAt: '2026-09-05T10:00:00.000Z',
      updatedAt: '2026-09-05T10:00:00.000Z',
    },
    {
      id: 'tx-tikvah-13',
      customerId: 'cust-tikvah',
      date: '2026-09-11',
      direction: 'RECEIPT',
      particulars: 'PURCHASE',
      description: 'RD/BB/104/26-27',
      nos: 1,
      grossWT: 0.403,
      stoneWT: 0.018,
      netWT: -0.385,
      touch: 76.0,
      pureWT: -0.293,
      stoneAmount: 1533,
      stoneAmountCal: -1533,
      mcRate: 0,
      mcAmount: 0,
      mcAmountCal: 0,
      totalAmount: -1533,
      balanceWT: 4.328,
      balanceMC: -5263.51,
      status: 'CONFIRMED',
      createdAt: '2026-09-11T10:00:00.000Z',
      updatedAt: '2026-09-11T10:00:00.000Z',
    },
  ];

  // Live Database States
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('sbg_live_customers');
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : defaultCustomersList;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('sbg_live_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<LedgerTransaction[]>(() => {
    const saved = localStorage.getItem('sbg_live_transactions');
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : defaultTransactionsList;
  });

  const [estimates, setEstimates] = useState<EstimateCostSheet[]>(() => {
    const saved = localStorage.getItem('sbg_live_estimates');
    return saved ? JSON.parse(saved) : [];
  });

  const [settlements, setSettlements] = useState<SettlementRecord[]>(() => {
    const saved = localStorage.getItem('sbg_live_settlements');
    return saved ? JSON.parse(saved) : [];
  });

  const [erpSyncItems, setErpSyncItems] = useState<ERPCommercialSyncItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [rate24k, setRate24k] = useState<number>(11904.65);
  const [rate995, setRate995] = useState<number>(11845.13);
  const [rate916, setRate916] = useState<number>(10904.66);
  const [selectedPurity, setSelectedPurityState] = useState<'995' | '916'>(() => {
    const saved = localStorage.getItem('sbg_purity');
    return saved === '916' ? '916' : '995';
  });
  const [goldRate24hChange, setGoldRate24hChange] = useState<number>(+0.24);
  const [goldRateSource, setGoldRateSource] = useState<string>('Yahoo Finance (Live)');
  const [isGoldRateLive, setIsGoldRateLive] = useState<boolean>(true);

  const [goldMarketRate, setGoldMarketRateState] = useState<number>(() => {
    return selectedPurity === '916' ? 10904.66 : 11845.13;
  });

  const [lastRateUpdate, setLastRateUpdate] = useState<string>('22 Sep 2026, 10:15 AM');
  const [defaultGSTRate, setDefaultGSTRate] = useState<number>(3.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'SYNCING' | 'OFFLINE'>('SYNCED');

  const setSelectedPurity = (purity: '995' | '916') => {
    setSelectedPurityState(purity);
    localStorage.setItem('sbg_purity', purity);
    setGoldMarketRateState(purity === '916' ? rate916 : rate995);
  };

  const refreshLiveGoldRate = async () => {
    try {
      const data: GoldRateData = await fetchLiveGoldRate();
      setRate24k(data.base24kPerGram);
      setRate995(data.rate995);
      setRate916(data.rate916);
      setGoldRate24hChange(data.change24hPercent);
      setLastRateUpdate(data.lastUpdated);
      setIsGoldRateLive(data.isLive);
      setGoldRateSource(data.source);

      const activeRate = selectedPurity === '916' ? data.rate916 : data.rate995;
      setGoldMarketRateState(activeRate);
      localStorage.setItem('sbg_gold_rate', activeRate.toString());
    } catch (e) {
      console.warn('Live gold rate refresh failed:', e);
    }
  };

  // Live fetch on mount & 5-minute interval
  useEffect(() => {
    refreshLiveGoldRate();
    const interval = setInterval(refreshLiveGoldRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedPurity]);

  // Supabase Realtime Gold Rate Channel Subscription for multi-user sync
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase.channel('sbg-gold-rate')
      .on('broadcast', { event: 'rate_update' }, (payload) => {
        if (payload.payload) {
          const { rate995: r995, rate916: r916, lastUpdated, change } = payload.payload;
          if (r995) setRate995(r995);
          if (r916) setRate916(r916);
          if (lastUpdated) setLastRateUpdate(lastUpdated);
          if (change) setGoldRate24hChange(change);
          setGoldMarketRateState(selectedPurity === '916' ? (r916 || rate916) : (r995 || rate995));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPurity, rate995, rate916]);

  // Supabase Data Fetcher
  const refreshFromDatabase = async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    setSyncStatus('SYNCING');
    try {
      const [
        custRes,
        ordRes,
        txRes,
        estRes,
        stlRes,
        audRes
      ] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('date', { ascending: true }),
        supabase.from('estimates').select('*').order('created_at', { ascending: false }),
        supabase.from('settlements').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50),
      ]);

      if (custRes.data && custRes.data.length > 0) {
        const mapped: Customer[] = custRes.data.map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          city: c.city,
          gstin: c.gstin,
          openingWT: Number(c.opening_wt) || 0,
          openingMC: Number(c.opening_mc) || 0,
          currentWT: Number(c.current_wt) || 0,
          currentMC: Number(c.current_mc) || 0,
          status: c.status || 'ACTIVE',
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
        setCustomers(mapped);
      }

      if (ordRes.data && ordRes.data.length > 0) {
        const mapped: Order[] = ordRes.data.map((o: any) => ({
          id: o.id,
          orderNo: o.order_no,
          customerId: o.customer_id,
          orderDate: o.order_date,
          deliveryDate: o.delivery_date,
          reference: o.reference,
          erpRef: o.erp_ref,
          itemDescription: o.item_description,
          status: o.status || 'IN_PRODUCTION',
          openingWT: Number(o.opening_wt) || 0,
          openingMC: Number(o.opening_mc) || 0,
          currentWT: Number(o.current_wt) || 0,
          currentMC: Number(o.current_mc) || 0,
          targetGrossWT: Number(o.target_gross_wt) || 0,
          targetPurity: Number(o.target_purity) || 91.6,
          notes: o.notes,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        }));
        setOrders(mapped);
      }

      if (txRes.data && txRes.data.length > 0) {
        const mapped: LedgerTransaction[] = txRes.data.map((t: any) => ({
          id: t.id,
          customerId: t.customer_id,
          orderId: t.order_id,
          date: t.date,
          direction: t.direction,
          particulars: t.particulars,
          description: t.description,
          nos: t.nos || 0,
          grossWT: Number(t.gross_wt) || 0,
          stoneWT: Number(t.stone_wt) || 0,
          stoneWTCarat: Number(t.stone_wt_carat) || 0,
          netWT: Number(t.net_wt) || 0,
          touch: Number(t.touch) || 0,
          pureWT: Number(t.pure_wt) || 0,
          stoneAmount: Number(t.stone_amount) || 0,
          stoneAmountCal: Number(t.stone_amount_cal) || 0,
          mcRate: Number(t.mc_rate) || 0,
          mcAmount: Number(t.mc_amount) || 0,
          mcAmountCal: Number(t.mc_amount_cal) || 0,
          totalAmount: Number(t.total_amount) || 0,
          balanceWT: Number(t.balance_wt) || 0,
          balanceMC: Number(t.balance_mc) || 0,
          status: t.status || 'CONFIRMED',
          erpRef: t.erp_ref,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));
        setTransactions(mapped);
      }

      if (estRes.data && estRes.data.length > 0) {
        setEstimates(estRes.data);
      }

      if (stlRes.data && stlRes.data.length > 0) {
        setSettlements(stlRes.data);
      }

      if (audRes.data && audRes.data.length > 0) {
        setAuditLogs(audRes.data);
      }

      setSyncStatus('SYNCED');
    } catch (err) {
      console.warn('Supabase sync error (using local state fallback):', err);
      setSyncStatus('OFFLINE');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshFromDatabase();
  }, []);

  // Sync to local storage for instant offline resilience
  useEffect(() => {
    localStorage.setItem('sbg_auth', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('sbg_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sbg_live_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('sbg_live_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('sbg_live_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('sbg_live_estimates', JSON.stringify(estimates));
  }, [estimates]);

  useEffect(() => {
    localStorage.setItem('sbg_live_settlements', JSON.stringify(settlements));
  }, [settlements]);

  const setGoldMarketRate = (rate: number) => {
    setGoldMarketRateState(rate);
    if (selectedPurity === '916') {
      setRate916(rate);
    } else {
      setRate995(rate);
    }
    const now = new Date();
    const formatted = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    setLastRateUpdate(formatted);
    localStorage.setItem('sbg_gold_rate', rate.toString());

    if (isSupabaseConfigured) {
      try {
        supabase.channel('sbg-gold-rate').send({
          type: 'broadcast',
          event: 'rate_update',
          payload: {
            rate995: selectedPurity === '995' ? rate : rate995,
            rate916: selectedPurity === '916' ? rate : rate916,
            lastUpdated: formatted,
            change: goldRate24hChange,
          },
        });
      } catch (e) {
        console.warn('Realtime broadcast error:', e);
      }
    }
  };

  const login = (username?: string, _password?: string) => {
    setIsAuthenticated(true);
    localStorage.setItem('sbg_auth', 'true');
    if (username) {
      const match = defaultUsers.find((u) => u.username === username.toLowerCase() || u.email.includes(username));
      if (match) setCurrentUser(match);
    }
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('sbg_auth', 'false');
  };

  const logAudit = async (
    action: string,
    module: AuditLogEntry['module'],
    recordId: string,
    details?: string,
    prev?: any,
    next?: any
  ) => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      module,
      recordId,
      details,
      previousValue: prev,
      newValue: next,
    };
    setAuditLogs((prevLogs) => [entry, ...prevLogs]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('audit_logs').insert([{
          id: entry.id,
          timestamp: entry.timestamp,
          user_id: entry.userId,
          user_name: entry.userName,
          action: entry.action,
          module: entry.module,
          record_id: entry.recordId,
          details: entry.details,
          previous_value: entry.previousValue,
          new_value: entry.newValue,
        }]);
      } catch (e) {
        // Silent catch for background audit
      }
    }
  };

  const switchUserRole = (role: UserAccount['role']) => {
    const found = defaultUsers.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
      logAudit('SWITCH_USER_ROLE', 'USERS', found.id, `Switched active profile to ${found.name}`);
    }
  };

  // Customer Management
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'currentWT' | 'currentMC'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      currentWT: customerData.openingWT,
      currentMC: customerData.openingMC,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, newCustomer]);
    logAudit('CREATE_CUSTOMER', 'CUSTOMERS', newCustomer.id, `Created customer ${newCustomer.name} (${newCustomer.code})`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('customers').insert([{
          id: newCustomer.id,
          code: newCustomer.code,
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          address: newCustomer.address,
          city: newCustomer.city,
          gstin: newCustomer.gstin,
          opening_wt: newCustomer.openingWT,
          opening_mc: newCustomer.openingMC,
          current_wt: newCustomer.currentWT,
          current_mc: newCustomer.currentMC,
          status: newCustomer.status,
          created_at: newCustomer.createdAt,
          updated_at: newCustomer.updatedAt,
        }]);
      } catch (e) {
        console.error('Supabase customer insert error:', e);
      }
    }

    return newCustomer;
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
    logAudit('UPDATE_CUSTOMER', 'CUSTOMERS', id, `Updated customer profile`, undefined, updates);

    if (isSupabaseConfigured) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.city !== undefined) payload.city = updates.city;
        if (updates.currentWT !== undefined) payload.current_wt = updates.currentWT;
        if (updates.currentMC !== undefined) payload.current_mc = updates.currentMC;
        if (updates.status !== undefined) payload.status = updates.status;

        await supabase.from('customers').update(payload).eq('id', id);
      } catch (e) {
        console.error('Supabase customer update error:', e);
      }
    }
  };

  const deleteCustomer = async (id: string) => {
    const existing = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (existing) {
      logAudit('DELETE_CUSTOMER', 'CUSTOMERS', id, `Deleted customer ${existing.name}`);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('customers').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase customer delete error:', e);
      }
    }
  };

  const getCustomer = (id: string) => customers.find((c) => c.id === id);

  // Order Management
  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'currentWT' | 'currentMC'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      currentWT: orderData.openingWT,
      currentMC: orderData.openingMC,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    logAudit('CREATE_ORDER', 'ORDERS', newOrder.id, `Created order ${newOrder.orderNo}`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').insert([{
          id: newOrder.id,
          order_no: newOrder.orderNo,
          customer_id: newOrder.customerId,
          order_date: newOrder.orderDate,
          delivery_date: newOrder.deliveryDate,
          reference: newOrder.reference,
          erp_ref: newOrder.erpRef,
          item_description: newOrder.itemDescription,
          status: newOrder.status,
          opening_wt: newOrder.openingWT,
          opening_mc: newOrder.openingMC,
          current_wt: newOrder.currentWT,
          current_mc: newOrder.currentMC,
          target_gross_wt: newOrder.targetGrossWT,
          target_purity: newOrder.targetPurity,
          notes: newOrder.notes,
          created_at: newOrder.createdAt,
          updated_at: newOrder.updatedAt,
        }]);
      } catch (e) {
        console.error('Supabase order insert error:', e);
      }
    }

    return newOrder;
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o))
    );
    logAudit('UPDATE_ORDER', 'ORDERS', id, `Updated order status or details`, undefined, updates);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').update(updates).eq('id', id);
      } catch (e) {
        console.error('Supabase order update error:', e);
      }
    }
  };

  const getOrder = (id: string) => orders.find((o) => o.id === id);

  // Transaction Ledger Management
  const recalculateAndSaveCustomerBalances = async (customerId: string, updatedTxList: LedgerTransaction[]) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const customerTxs = updatedTxList.filter((tx) => tx.customerId === customerId);
    const recalculatedTxs = calculateRunningBalances(customerTxs, customer.openingWT, customer.openingMC);

    const otherTxs = updatedTxList.filter((tx) => tx.customerId !== customerId);
    const finalTxList = [...otherTxs, ...recalculatedTxs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setTransactions(finalTxList);

    const summary = calculateCustomerSummaryBalances(recalculatedTxs, customer.openingWT, customer.openingMC);
    await updateCustomer(customerId, {
      currentWT: summary.currentWT,
      currentMC: summary.currentMC,
    });
  };

  const addTransaction = async (
    txData: Omit<LedgerTransaction, 'id' | 'createdAt' | 'updatedAt' | 'balanceWT' | 'balanceMC'>
  ) => {
    const netWT = calculateNetWT(txData.grossWT, txData.stoneWT, txData.direction);
    const pureWT = calculatePureWT(netWT, txData.touch);
    const totalAmount = calculateTotalAmount(txData.stoneAmountCal, txData.mcAmountCal);

    const newTx: LedgerTransaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      netWT,
      pureWT,
      totalAmount,
      balanceWT: 0,
      balanceMC: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newTxList = [...transactions, newTx];
    await recalculateAndSaveCustomerBalances(txData.customerId, newTxList);

    logAudit(
      'ADD_TRANSACTION',
      'LEDGER',
      newTx.id,
      `${txData.direction} ${txData.particulars}: Net WT ${netWT}g, Pure WT ${pureWT}g, Total ₹${totalAmount}`
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('transactions').insert([{
          id: newTx.id,
          customer_id: newTx.customerId,
          order_id: newTx.orderId,
          date: newTx.date,
          direction: newTx.direction,
          particulars: newTx.particulars,
          description: newTx.description,
          nos: newTx.nos,
          gross_wt: newTx.grossWT,
          stone_wt: newTx.stoneWT,
          net_wt: newTx.netWT,
          touch: newTx.touch,
          pure_wt: newTx.pureWT,
          mc_amount: newTx.mcAmount,
          total_amount: newTx.totalAmount,
          balance_wt: newTx.balanceWT,
          balance_mc: newTx.balanceMC,
          status: newTx.status,
          erp_ref: newTx.erpRef,
          created_at: newTx.createdAt,
          updated_at: newTx.updatedAt,
        }]);
      } catch (e) {
        console.error('Supabase transaction insert error:', e);
      }
    }

    return newTx;
  };

  const updateTransaction = async (id: string, updates: Partial<LedgerTransaction>) => {
    const existing = transactions.find((t) => t.id === id);
    if (!existing) return;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const netWT = calculateNetWT(merged.grossWT, merged.stoneWT, merged.direction);
    const pureWT = calculatePureWT(netWT, merged.touch);
    const totalAmount = calculateTotalAmount(merged.stoneAmountCal, merged.mcAmountCal);

    const finalizedTx: LedgerTransaction = {
      ...merged,
      netWT,
      pureWT,
      totalAmount,
    };

    const newTxList = transactions.map((t) => (t.id === id ? finalizedTx : t));
    await recalculateAndSaveCustomerBalances(finalizedTx.customerId, newTxList);

    logAudit('UPDATE_TRANSACTION', 'LEDGER', id, `Updated transaction ${id}`, existing, finalizedTx);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('transactions').update(finalizedTx).eq('id', id);
      } catch (e) {
        console.error('Supabase transaction update error:', e);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    const existing = transactions.find((t) => t.id === id);
    if (!existing) return;

    const newTxList = transactions.filter((t) => t.id !== id);
    await recalculateAndSaveCustomerBalances(existing.customerId, newTxList);
    logAudit('DELETE_TRANSACTION', 'LEDGER', id, `Deleted transaction ${id}`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase transaction delete error:', e);
      }
    }
  };

  const importCustomerTransactions = async (
    customerId: string,
    txDataList: Omit<LedgerTransaction, 'id' | 'createdAt' | 'updatedAt' | 'balanceWT' | 'balanceMC'>[],
    replaceExisting: boolean = true
  ) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const formattedList: LedgerTransaction[] = txDataList.map((txData, index) => {
      const netWT = calculateNetWT(txData.grossWT, txData.stoneWT, txData.direction);
      const pureWT = calculatePureWT(netWT, txData.touch);
      const totalAmount = calculateTotalAmount(txData.stoneAmountCal, txData.mcAmountCal);

      return {
        ...txData,
        id: `tx-imp-${Date.now()}-${index}`,
        netWT,
        pureWT,
        totalAmount,
        balanceWT: 0,
        balanceMC: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    let baseTxList = transactions;
    if (replaceExisting) {
      baseTxList = transactions.filter((t) => t.customerId !== customerId);
    }

    const updatedTxList = [...baseTxList, ...formattedList];
    await recalculateAndSaveCustomerBalances(customerId, updatedTxList);

    logAudit(
      'IMPORT_TRANSACTIONS',
      'LEDGER',
      customerId,
      `Imported ${txDataList.length} transactions from sheet for ${customer.name}`
    );
  };

  const getCustomerTransactions = (customerId: string) =>
    transactions.filter((tx) => tx.customerId === customerId);

  const getOrderTransactions = (orderId: string) =>
    transactions.filter((tx) => tx.orderId === orderId);

  const addEstimate = async (estimate: EstimateCostSheet) => {
    setEstimates((prev) => [estimate, ...prev]);
    logAudit('CREATE_ESTIMATE', 'ESTIMATES', estimate.id, `Created estimate ${estimate.estimateNo}`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('estimates').insert([estimate]);
      } catch (e) {
        console.error('Supabase estimate insert error:', e);
      }
    }
  };

  const updateEstimate = async (id: string, updates: Partial<EstimateCostSheet>) => {
    setEstimates((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e))
    );
    logAudit('UPDATE_ESTIMATE', 'ESTIMATES', id, `Updated estimate ${id}`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('estimates').update(updates).eq('id', id);
      } catch (e) {
        console.error('Supabase estimate update error:', e);
      }
    }
  };

  const deleteEstimate = async (id: string) => {
    setEstimates((prev) => prev.filter((e) => e.id !== id));
    logAudit('DELETE_ESTIMATE', 'ESTIMATES', id, `Deleted estimate ${id}`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('estimates').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase estimate delete error:', e);
      }
    }
  };

  const getEstimate = (id: string) => estimates.find((e) => e.id === id);

  const addSettlement = async (input: {
    customerId: string;
    orderId?: string;
    settlementType: 'GOLD_ONLY' | 'CASH_ONLY' | 'GOLD_AND_CASH';
    goldReceived: number;
    cashReceived: number;
    agreedGoldRate: number;
    notes?: string;
  }) => {
    const customer = customers.find((c) => c.id === input.customerId);
    const prevWT = customer?.currentWT || 0;
    const prevMC = customer?.currentMC || 0;

    const result = calculateSettlement({
      customerId: input.customerId,
      orderId: input.orderId,
      settlementType: input.settlementType,
      previousBalanceWT: prevWT,
      previousBalanceMC: prevMC,
      goldReceived: input.goldReceived,
      cashReceived: input.cashReceived,
      agreedGoldRate: input.agreedGoldRate,
      notes: input.notes,
    });

    const newSettlement: SettlementRecord = {
      id: `set-${Date.now()}`,
      settlementNo: `SET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      customerId: input.customerId,
      customerName: customer?.name || 'Customer',
      orderId: input.orderId,
      settlementType: input.settlementType,
      previousBalanceWT: prevWT,
      previousBalanceMC: prevMC,
      goldReceived: input.goldReceived,
      cashReceived: input.cashReceived,
      agreedGoldRate: input.agreedGoldRate,
      newBalanceWT: result.newBalanceWT,
      newBalanceMC: result.newBalanceMC,
      notes: input.notes,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    setSettlements((prev) => [newSettlement, ...prev]);

    await updateCustomer(input.customerId, {
      currentWT: result.newBalanceWT,
      currentMC: result.newBalanceMC,
    });

    logAudit(
      'CREATE_SETTLEMENT',
      'SETTLEMENTS',
      newSettlement.id,
      `Processed ${input.settlementType} settlement for ${customer?.name}`
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.from('settlements').insert([newSettlement]);
      } catch (e) {
        console.error('Supabase settlement insert error:', e);
      }
    }

    return newSettlement;
  };

  const resolveDiscrepancy = (id: string, resolutionNotes: string) => {
    setErpSyncItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'MATCHED' as const, discrepancyReason: resolutionNotes } : item
      )
    );
    logAudit('RESOLVE_ERP_DISCREPANCY', 'ERP', id, `Resolved discrepancy: ${resolutionNotes}`);
  };

  const clearAllData = () => {
    setCustomers([]);
    setOrders([]);
    setTransactions([]);
    setEstimates([]);
    setSettlements([]);
    setErpSyncItems([]);
    setAuditLogs([]);
    localStorage.removeItem('sbg_live_customers');
    localStorage.removeItem('sbg_live_orders');
    localStorage.removeItem('sbg_live_transactions');
    localStorage.removeItem('sbg_live_estimates');
    localStorage.removeItem('sbg_live_settlements');
  };

  return (
    <SBGContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        currentUser,
        setCurrentUser,
        availableUsers,
        switchUserRole,
        addUser,
        updateUser,
        deleteUser,
        isLoading,
        syncStatus,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomer,
        orders,
        addOrder,
        updateOrder,
        getOrder,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        importCustomerTransactions,
        getCustomerTransactions,
        getOrderTransactions,
        estimates,
        addEstimate,
        updateEstimate,
        deleteEstimate,
        getEstimate,
        settlements,
        addSettlement,
        erpSyncItems,
        resolveDiscrepancy,
        auditLogs,
        logAudit,
        goldMarketRate,
        rate24k,
        rate995,
        rate916,
        selectedPurity,
        setSelectedPurity,
        goldRate24hChange,
        goldRateSource,
        isGoldRateLive,
        refreshLiveGoldRate,
        setGoldMarketRate,
        defaultGSTRate,
        setDefaultGSTRate,
        lastRateUpdate,
        refreshFromDatabase,
        clearAllData,
      }}
    >
      {children}
    </SBGContext.Provider>
  );
};

export const useSBG = () => {
  const context = useContext(SBGContext);
  if (!context) {
    throw new Error('useSBG must be used within an SBGProvider');
  }
  return context;
};
