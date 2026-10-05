export type TransactionDirection = 'ISSUE' | 'RECEIPT';

export type ParticularsType = 
  | 'PURCHASE'
  | 'SALE'
  | 'SALES'
  | 'PR'
  | 'RECEIPT'
  | 'ISSUE'
  | 'RETURN'
  | 'SETTLEMENT'
  | 'OPENING_BALANCE'
  | 'ADJUSTMENT'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_PAID'
  | 'PAYMENT RECEIVED'
  | 'PAYMENT PAID';

export type RateUnit = 'PER_G' | 'PER_CT' | 'PER_PIECE' | 'PERCENT' | 'LUMP_SUM';

export type EstimateItemCategory = 
  | 'GOLD'
  | 'DIAMOND'
  | 'PRECIOUS_STONE'
  | 'MAKING_CHARGE'
  | 'FINDINGS'
  | 'OTHER';

export interface LedgerTransaction {
  id: string;
  customerId: string;
  orderId?: string;
  date: string;
  direction: TransactionDirection;
  particulars: ParticularsType;
  description: string;
  nos: number;
  grossWT: number;
  stoneWT: number; // in grams (or converted from ct)
  stoneWTCarat?: number;
  netWT: number; // Signed according to direction
  touch: number; // e.g. 76 for 76%
  pureWT: number; // Signed according to direction
  stoneAmount: number;
  stoneAmountCal: number;
  mcRate?: number;
  mcAmount: number;
  mcAmountCal: number;
  totalAmount: number;
  balanceWT: number; // Running balance Pure WT
  balanceMC: number; // Running balance MC Amount
  status: 'DRAFT' | 'CONFIRMED' | 'FINALIZED';
  erpRef?: string;
  estimateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateSubItem {
  id: string;
  name: string; // e.g. "Gold 18KT", "Rubie", "Diamond", "Making Charges"
  category: EstimateItemCategory;
  nos: number;
  weight: number; // in grams or carats
  unit: 'g' | 'ct';
  weightInGrams?: number;
  weightInCarats?: number;
  touch?: number; // percentage, e.g. 76 for 76%
  pureWT?: number;
  rate: number;
  rateUnit: RateUnit;
  amount: number;
  remarks?: string;
}

export interface EstimateLineItem {
  id: string;
  sl: number;
  item: string;
  category: EstimateItemCategory;
  nos: number;
  grossWT: number;
  stoneWT: number; // in grams
  stoneWTUnit?: 'g' | 'ct';
  stoneWTCarats?: number;
  netWT: number;
  touch: number; // percentage, e.g. 76 for 76%
  pureWT: number;
  rate: number;
  rateUnit: RateUnit;
  amount: number;
  remarks?: string;
  subItems?: EstimateSubItem[];
}

export interface EstimateCostSheet {
  id: string;
  estimateNo: string;
  estimateDate: string;
  customerId: string;
  customerName?: string;
  orderId?: string;
  orderRef?: string;
  customerRef?: string;
  touchFixed: boolean;
  isGold: boolean;
  transactionType?: 'PURCHASE' | 'SALE';
  direction?: TransactionDirection;
  settlementMode?: 'FIX' | 'UNFIX' | 'GOLD_AND_CASH' | 'CASH_ONLY' | 'GOLD_ONLY';
  goldRate: number;
  goldRatePurity: number; // e.g. 99.5 or 100
  diamondRate?: number; // Master default diamond rate per ct (₹)
  stoneRate?: number; // Master default gemstone rate per ct/g (₹)
  mcRate?: number; // Master default making charge rate per g (₹)
  wastagePercent?: number; // Master wastage percentage (%)
  unfixGoldRate?: number;
  unfixGoldRatePurity?: number;
  remarks?: string;
  items: EstimateLineItem[];
  totals: {
    goldValue: number;
    diamondValue: number;
    psValue: number;
    mcValue: number;
    taxableValue: number;
    gstRate: number; // percentage, e.g. 3
    gstAmount: number;
    grandTotal: number;
    remainingCashValue?: number; // grandTotal - goldValue (or non-metal cash total)
    totalGrossWT: number;
    totalStoneWT: number;
    totalNetWT: number;
    totalPureWT: number;
    // Category weight breakdowns
    goldGrossWT?: number;
    goldStoneWT?: number;
    goldNetWT?: number;
    goldPureWT?: number;
    diamondGrossWT?: number;
    diamondStoneWT?: number;
    diamondCarats?: number;
    diamondPureWT?: number;
    psGrossWT?: number;
    psStoneWT?: number;
    psCarats?: number;
    psPureWT?: number;
    otherGrossWT?: number;
    otherStoneWT?: number;
    otherNetWT?: number;
    otherPureWT?: number;
  };
  previousBalanceWT?: number;
  previousBalanceMC?: number;
  deltaPureWT?: number;
  deltaAmount?: number;
  newBalanceWT?: number;
  newBalanceMC?: number;
  balanceComparison: {
    gSheetOldPureWT: number;
    gSheetOldAmount: number;
    gSheetNewPureWT: number;
    gSheetNewAmount: number;
    ledgerOldPureWT: number;
    ledgerOldAmount: number;
    ledgerNewPureWT: number;
    ledgerNewAmount: number;
    deltaPureWT?: number;
    deltaAmount?: number;
    pureWTDiff: number;
    amountDiff: number;
    isReconciled: boolean;
  };
  status: 'DRAFT' | 'CONFIRMED' | 'FINALIZED' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

export interface SettlementRecord {
  id: string;
  settlementNo: string;
  date: string;
  customerId: string;
  customerName?: string;
  orderId?: string;
  settlementType: 'GOLD_ONLY' | 'CASH_ONLY' | 'GOLD_AND_CASH';
  previousBalanceWT: number;
  previousBalanceMC: number;
  goldReceived: number; // in grams
  cashReceived: number; // in currency ₹
  agreedGoldRate: number; // ₹ per gram
  newBalanceWT: number;
  newBalanceMC: number;
  notes?: string;
  status: 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  gstin?: string;
  openingWT: number; // g
  openingMC: number; // ₹
  currentWT: number; // g
  currentMC: number; // ₹
  status: 'ACTIVE' | 'INACTIVE';
  creditLimitMC?: number;
  creditLimitWT?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  orderDate: string;
  deliveryDate?: string;
  reference: string;
  erpRef?: string;
  itemDescription: string;
  status: 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED' | 'SETTLED' | 'CANCELLED';
  openingWT: number;
  openingMC: number;
  currentWT: number;
  currentMC: number;
  targetGrossWT?: number;
  targetPurity?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: 'CUSTOMERS' | 'ORDERS' | 'LEDGER' | 'ESTIMATES' | 'SETTLEMENTS' | 'USERS' | 'SETTINGS' | 'ERP';
  recordId: string;
  recordRef?: string;
  previousValue?: any;
  newValue?: any;
  details?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CLIENT';
  status: 'ACTIVE' | 'DISABLED';
  password?: string;
  customerId?: string;
  avatarColor?: string;
  permissions: {
    customers: boolean;
    orders: boolean;
    transactions: boolean;
    estimates: boolean;
    settlements: boolean;
    reports: boolean;
    users: boolean;
    erp: boolean;
  };
}
