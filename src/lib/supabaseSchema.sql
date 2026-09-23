-- SBG JEWELLERY COMMERCIAL SUITE - SUPABASE DATABASE SCHEMA

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT,
    gstin TEXT,
    opening_wt NUMERIC(12, 3) DEFAULT 0.000,
    opening_mc NUMERIC(14, 2) DEFAULT 0.00,
    current_wt NUMERIC(12, 3) DEFAULT 0.000,
    current_mc NUMERIC(14, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'ACTIVE',
    credit_limit_mc NUMERIC(14, 2),
    credit_limit_wt NUMERIC(12, 3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_no TEXT NOT NULL UNIQUE,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE CASCADE,
    order_date DATE NOT NULL,
    delivery_date DATE,
    reference TEXT NOT NULL,
    erp_ref TEXT,
    item_description TEXT NOT NULL,
    status TEXT DEFAULT 'IN_PRODUCTION',
    opening_wt NUMERIC(12, 3) DEFAULT 0.000,
    opening_mc NUMERIC(14, 2) DEFAULT 0.00,
    current_wt NUMERIC(12, 3) DEFAULT 0.000,
    current_mc NUMERIC(14, 2) DEFAULT 0.00,
    target_gross_wt NUMERIC(12, 3),
    target_purity NUMERIC(6, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transactions / Customer Ledger Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('ISSUE', 'RECEIPT')),
    particulars TEXT NOT NULL,
    description TEXT NOT NULL,
    nos INTEGER DEFAULT 0,
    gross_wt NUMERIC(12, 3) DEFAULT 0.000,
    stone_wt NUMERIC(12, 3) DEFAULT 0.000,
    stone_wt_carat NUMERIC(12, 2),
    net_wt NUMERIC(12, 3) DEFAULT 0.000,
    touch NUMERIC(6, 2) DEFAULT 0.00,
    pure_wt NUMERIC(12, 3) DEFAULT 0.000,
    stone_amount NUMERIC(14, 2) DEFAULT 0.00,
    stone_amount_cal NUMERIC(14, 2) DEFAULT 0.00,
    mc_rate NUMERIC(12, 2),
    mc_amount NUMERIC(14, 2) DEFAULT 0.00,
    mc_amount_cal NUMERIC(14, 2) DEFAULT 0.00,
    total_amount NUMERIC(14, 2) DEFAULT 0.00,
    balance_wt NUMERIC(12, 3) DEFAULT 0.000,
    balance_mc NUMERIC(14, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'CONFIRMED',
    erp_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Estimates & Cost Sheets Table
CREATE TABLE IF NOT EXISTS public.estimates (
    id TEXT PRIMARY KEY,
    estimate_no TEXT NOT NULL UNIQUE,
    estimate_date TEXT NOT NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT,
    order_id TEXT,
    order_ref TEXT,
    customer_ref TEXT,
    touch_fixed BOOLEAN DEFAULT true,
    is_gold BOOLEAN DEFAULT true,
    gold_rate NUMERIC(12, 2) NOT NULL,
    gold_rate_purity NUMERIC(6, 2) DEFAULT 99.5,
    unfix_gold_rate NUMERIC(12, 2),
    unfix_gold_rate_purity NUMERIC(6, 2),
    remarks TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    totals JSONB NOT NULL,
    balance_comparison JSONB NOT NULL,
    status TEXT DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Settlements Table
CREATE TABLE IF NOT EXISTS public.settlements (
    id TEXT PRIMARY KEY,
    settlement_no TEXT NOT NULL UNIQUE,
    date DATE NOT NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT,
    order_id TEXT,
    settlement_type TEXT NOT NULL,
    previous_balance_wt NUMERIC(12, 3) DEFAULT 0.000,
    previous_balance_mc NUMERIC(14, 2) DEFAULT 0.00,
    gold_received NUMERIC(12, 3) DEFAULT 0.000,
    cash_received NUMERIC(14, 2) DEFAULT 0.00,
    agreed_gold_rate NUMERIC(12, 2) NOT NULL,
    new_balance_wt NUMERIC(12, 3) DEFAULT 0.000,
    new_balance_mc NUMERIC(14, 2) DEFAULT 0.00,
    notes TEXT,
    status TEXT DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id TEXT NOT NULL,
    record_ref TEXT,
    previous_value JSONB,
    new_value JSONB,
    details TEXT
);

-- Enable Row Level Security (RLS) and permissive access for authenticated/anon apps
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow full access to orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow full access to transactions" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Allow full access to estimates" ON public.estimates FOR ALL USING (true);
CREATE POLICY "Allow full access to settlements" ON public.settlements FOR ALL USING (true);
CREATE POLICY "Allow full access to audit_logs" ON public.audit_logs FOR ALL USING (true);
