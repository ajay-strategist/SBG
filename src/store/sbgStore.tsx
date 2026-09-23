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

  // System Settings
  goldMarketRate: number;
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
    avatarColor: '#0F5C5B',
    permissions: {
      customers: true,
      orders: true,
      transactions: true,
      estimates: true,
      settlements: true,
      reports: true,
      users: true,
      erp: true,
    },
  },
  {
    id: 'usr-2',
    username: 'accountant',
    name: 'Sunita Sharma',
    email: 'sunita@sbgjewels.com',
    role: 'ACCOUNTANT',
    status: 'ACTIVE',
    avatarColor: '#23827F',
    permissions: {
      customers: true,
      orders: true,
      transactions: true,
      estimates: true,
      settlements: true,
      reports: true,
      users: false,
      erp: true,
    },
  },
  {
    id: 'usr-3',
    username: 'manager',
    name: 'Vikram Sethi',
    email: 'vikram@sbgjewels.com',
    role: 'MANAGER',
    status: 'ACTIVE',
    avatarColor: '#D9B76C',
    permissions: {
      customers: true,
      orders: true,
      transactions: true,
      estimates: true,
      settlements: false,
      reports: true,
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

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('sbg_user');
    return saved ? JSON.parse(saved) : defaultUsers[0];
  });

  // Live Database States (Initial empty, populated via Supabase)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('sbg_live_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('sbg_live_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<LedgerTransaction[]>(() => {
    const saved = localStorage.getItem('sbg_live_transactions');
    return saved ? JSON.parse(saved) : [];
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

  const [goldMarketRate, setGoldMarketRateState] = useState<number>(() => {
    const saved = localStorage.getItem('sbg_gold_rate');
    return saved ? parseFloat(saved) : 11845.13;
  });

  const [lastRateUpdate, setLastRateUpdate] = useState<string>('22 Sep 2026, 10:15 AM');
  const [defaultGSTRate, setDefaultGSTRate] = useState<number>(3.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'SYNCING' | 'OFFLINE'>('SYNCED');

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
    const now = new Date();
    const formatted = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    setLastRateUpdate(formatted);
    localStorage.setItem('sbg_gold_rate', rate.toString());
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
        availableUsers: defaultUsers,
        switchUserRole,
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
