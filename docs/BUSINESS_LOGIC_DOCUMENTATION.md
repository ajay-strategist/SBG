# Sree Balaji Gold (SBG) Commercial Suite
## Comprehensive Business Logic & Functional Specification Document

**Document Version:** 2.0  
**Target Audience:** Business Stakeholders, Accountants, Store Managers, Jewellery Bullion Dealers, and Non-Technical Commercial Users  
**System Source of Truth:** Current Codebase Implementation  

---

### Table of Contents
1. [Executive Overview & Core Accounting Philosophy](#1-executive-overview--core-accounting-philosophy)
2. [Dual-Ledger Architecture: Pure Gold Grams & Cash Rupee Ledger](#2-dual-ledger-architecture-pure-gold-grams--cash-rupee-ledger)
3. [Mathematical Rules, Precision & Unit Conversions](#3-mathematical-rules-precision--unit-conversions)
4. [Line Item & Sub-Item Valuation Engine](#4-line-item--sub-item-valuation-engine)
5. [Goods & Services Tax (GST) Calculations](#5-goods--services-tax-gst-calculations)
6. [Estimate Cost Sheets & Settlement Presets](#6-estimate-cost-sheets--settlement-presets)
7. [Estimate Financial Lifecycle & Atomic Ledger Postings](#7-estimate-financial-lifecycle--atomic-ledger-postings)
8. [Direct Customer Transactions & Quick Payment Vouchers](#8-direct-customer-transactions--quick-payment-vouchers)
9. [Gold & Cash Settlements Engine](#9-gold--cash-settlements-engine)
10. [Customer KYC & Profile Ledgers](#10-customer-kyc--profile-ledgers)
11. [Commercial Orders & Manufacturing Unit Tracking](#11-commercial-orders--manufacturing-unit-tracking)
12. [Financial & Commercial Reports](#12-financial--commercial-reports)
13. [Security, Roles, Audit Trail & System Settings](#13-security-roles-audit-trail--system-settings)
14. [Invoice & Print Layout Specifications](#14-invoice--print-layout-specifications)
15. [Removed Features & Items Requiring Confirmation](#15-removed-features--items-requiring-confirmation)

---

### 1. Executive Overview & Core Accounting Philosophy

The **Sree Balaji Gold (SBG) Commercial Suite** is an enterprise-grade jewellery ERP and bullion accounting system tailored specifically for the wholesale jewellery, casting manufacturing, and bullion trading industry.

Unlike conventional retail billing software where all transactions resolve strictly to currency (₹ INR), the wholesale jewellery and bullion trade operates on a **dual-currency commercial model**:
1. **Physical Fine Gold Weight** (Fine 24KT / 99.5% or 99.9% Pure Gold in Grams)
2. **Indian Rupees** (₹ INR for Making Charges, Diamonds, Precious Gemstones, Additional Expenses, and Taxes)

In the wholesale ecosystem, jewellers and retail clients frequently provide raw gold metal bars or scrap ornaments to settle the gold metal portion of an invoice, while paying making charges and gemstone costs in cash or bank transfer (RTGS/NEFT). Alternatively, clients may settle making charges in gold metal equivalent, or choose to fix the entire invoice into a single rupee figure.

The SBG system formalizes these wholesale practices into an automated, transparent, and mathematically rigorous application, eliminating human arithmetic errors and floating-point rounding discrepancies.

---

### 2. Dual-Ledger Architecture: Pure Gold Grams & Cash Rupee Ledger

Every customer registered in SBG maintains an independent, parallel **Dual-Ledger Account**:

| Ledger Component | Symbol / Key | Unit of Measure | Precision | Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **Pure Gold Weight Balance** | `currentWT` | Grams (g) | 3 Decimals (`0.001 g`) | Pure 24KT Fine Gold owed or held |
| **Making Charge / Cash Balance** | `currentMC` | Indian Rupees (₹) | 2 Decimals (`₹ 0.01`) | Currency funds owed or held |

#### 2.1 Sign Convention and Balance Meaning
To provide absolute clarity for accountants and business managers:
- **Positive Balance (`> 0`)**: The Customer **owes** SBG (Receivable / Asset for SBG).
  - *Example:* `Pure WT = +15.500 g` means the customer owes SBG 15.500 grams of pure gold.
  - *Example:* `Cash = +₹ 25,000.00` means the customer owes SBG ₹ 25,000.00 in cash.
- **Negative Balance (`< 0`)**: SBG **owes** the Customer (Advance / Liability for SBG).
  - *Example:* `Pure WT = -10.200 g` means SBG holds an advance deposit of 10.200 grams of pure gold belonging to the customer.
  - *Example:* `Cash = -₹ 50,000.00` means SBG holds an advance payment of ₹ 50,000.00 from the customer.
- **Zero Balance (`0.000 g` / `₹ 0.00`)**: The customer account is fully settled and reconciled.

#### 2.2 Direction Multipliers
All ledger transactions have a strict direction that dictates how they impact customer balances:
- **`ISSUE` (+1 Multiplier)**:
  - Goods, ornaments, gold bars, or services issued out from SBG to the customer.
  - **Increases** customer liability (moves balance in the positive direction).
- **`RECEIPT` (-1 Multiplier)**:
  - Gold metal, old scrap gold, casting deliveries, or cash/bank payments received into SBG from the customer.
  - **Decreases** customer liability or creates an advance credit (moves balance in the negative direction).

---

### 3. Mathematical Rules, Precision & Unit Conversions

To prevent cumulative floating-point errors (such as `0.1 + 0.2 = 0.30000000000000004`), SBG enforces strict rounding at every calculation boundary using the `epsilon` rounding algorithm:
$$\text{Round}(v, d) = \frac{\text{Math.round}((v + \epsilon) \times 10^d)}{10^d}$$

#### 3.1 Standard Rounding Precisions
- **Gold and Silver Weights:** Exactly **3 decimal places** (`0.001 g` / milligrams).
- **Gemstones and Diamonds:** Exactly **3 decimal places** (`0.001 ct` / milligrams).
- **Currency (INR):** Exactly **2 decimal places** (`₹ 0.01` / paise).
- **Purity / Touch Percentage:** Exactly **2 decimal places** (`0.01%`).

#### 3.2 Metric Carat to Gram Conversion
In the jewellery trade, gemstones and diamonds are weighed in **metric carats (ct)**, whereas gold is weighed in **grams (g)**. When calculating Net Weight of ornaments, stone weights must be converted to grams:
$$1 \text{ Metric Carat (ct)} = 0.200 \text{ Grams (g)}$$
$$1 \text{ Gram (g)} = 5.000 \text{ Metric Carats (ct)}$$

*Example:* An ornament has a Gross Weight of `18.476 g` and contains `4.530 ct` of diamonds.
1. Stone Weight in Grams = $4.530 \times 0.200 = 0.906 \text{ g}$.
2. Net Gold Weight = $18.476 - 0.906 = 17.570 \text{ g}$.

#### 3.3 Net Weight and Pure Gold Formulas
1. **Net Weight Magnitude:**
   $$\text{Net WT Magnitude} = \max(0, \text{Gross WT} - \text{Stone WT in Grams})$$
2. **Directional Net Weight:**
   $$\text{Net WT} = \text{Net WT Magnitude} \times \text{Direction Multiplier}$$
   *(+1 for ISSUE, -1 for RECEIPT)*
3. **Pure Gold Weight (Pure WT):**
   $$\text{Pure WT} = \text{Net WT} \times \left(\frac{\text{Touch \%}}{100}\right)$$
4. **Calculated Touch / Purity:**
   $$\text{Touch \%} = \left(\frac{|\text{Pure WT}|}{|\text{Net WT}|}\right) \times 100$$

*Standard Industry Touch Benchmarks:*
- 24 Karat Fine Gold: `99.50%` or `99.90%`
- 22 Karat Standard Jewellery: `91.60%`
- 18 Karat Diamond Jewellery: `75.00%` or `76.00%` (standard export/commercial alloy)
- 14 Karat Jewellery: `58.50%`

---

### 4. Line Item & Sub-Item Valuation Engine

An Estimate Sheet in SBG can consist of simple single-line items or multi-component composite jewellery items (e.g., a diamond necklace consisting of gold casting, natural diamonds, rubies, and making charges).

#### 4.1 Rate Units
SBG supports five flexible commercial rating mechanisms:
1. **`PER_G` (Per Gram):**
   - For **Gold**: Multiplied by **Pure WT** if Touch is specified; otherwise Net WT.
   - For **Making Charges**: Multiplied by **Net WT** (or gross weight if net is zero).
2. **`PER_CT` (Per Carat):**
   - For **Diamonds & Gemstones**: Multiplied by total Carats (`Weight in Grams / 0.200` or direct carat entry).
3. **`PER_PIECE` (Per Piece / Nos):**
   - Multiplied by number of units / quantity (`nos`).
4. **`LUMP_SUM`:**
   - Fixed flat rate independent of weight or pieces.
5. **`PERCENT` (Percentage of Metal Value):**
   - Calculated as a direct percentage of the underlying fine gold metal value.

#### 4.2 Composite Items and Sub-Items Rollup Logic
When a line item has child sub-items:
- Each sub-item is independently calculated based on its specific category (`GOLD`, `DIAMOND`, `PRECIOUS_STONE`, `MAKING_CHARGE`, `FINDINGS`, `OTHER`), weight, unit (`g` or `ct`), touch %, rate, and rate unit.
- **Rule A (Complete Composition):** If the sub-items include an explicit `GOLD` component, the sum of all sub-item amounts represents the complete price of the item.
- **Rule B (Additive Stones/MC):** If no explicit `GOLD` sub-item is present, the parent line item calculates the base gold metal value, and the sub-items (diamonds, stones, making charges) are added on top.
- If stone weight was not explicitly typed on the parent line, the engine automatically sums all diamond and gemstone sub-item weights into grams and subtracts them from Gross Weight to establish the exact parent Net Gold Weight.

#### 4.3 Additional Company Expenses
Commercial estimates may include non-metal operational charges:
- **HUID / Hallmarking Charges:** Official Bureau of Indian Standards hallmarking fee.
- **Courier & Insured Logistics Charges:** Armored transit/courier fees.
- **Other Charges & Remarks:** Custom labor, certification, or packaging fees.
These charges form part of the Taxable Value and are tracked under `totalExpenses`.

---

### 5. Goods & Services Tax (GST) Calculations

In Indian jewellery commerce, standard Goods and Services Tax (GST) is **3.0%** (comprising 1.5% CGST + 1.5% SGST for intra-state, or 3.0% IGST for inter-state sales).

#### 5.1 Taxable Value
$$\text{Taxable Value} = \text{Gold Value} + \text{Diamond Value} + \text{Stone Value} + \text{Making Charges} + \text{Other Value} + \text{Total Expenses}$$

#### 5.2 Total GST and Component Breakdown
$$\text{Total GST (3\%)} = \text{RoundCurrency}(\text{Taxable Value} \times 0.03)$$
$$\text{Grand Total} = \text{Taxable Value} + \text{Total GST}$$

Because B2B clients frequently settle the gold portion in physical metal and non-gold components in cash, SBG performs an exact **Component-Level Tax Split**:
1. **Gold GST:**
   $$\text{Gold GST} = \text{RoundCurrency}(\text{Gold Value} \times 0.03)$$
2. **Non-Gold GST:**
   $$\text{Non-Gold GST} = \text{Total GST} - \text{Gold GST}$$
   *(Includes GST on Making Charges, Diamonds, Gemstones, Courier, and Hallmarking)*

---

### 6. Estimate Cost Sheets & Settlement Presets

When finalizing an estimate, the business must decide how the invoice will be settled. SBG provides **5 Settlement Presets**:

```
                       ┌───────────────────────────────────────────────┐
                       │          ESTIMATE GRAND TOTAL (100%)          │
                       └───────────────────────┬───────────────────────┘
                                               │
       ┌───────────────────┬───────────────────┼───────────────────┬───────────────────┐
       ▼                   ▼                   ▼                   ▼                   ▼
    ┌─────┐       ┌─────────────────┐ ┌─────────────────┐  ┌───────────────┐      ┌──────────┐
    │ FIX │       │ B2B WITHOUT MC  │ │   B2B WITH MC   │  │  ALL IN GOLD  │      │  CUSTOM  │
    └─────┘       └─────────────────┘ └─────────────────┘  └───────────────┘      └──────────┘
  100% Cash         Gold & Gold GST     Gold, Gold GST       100% Converted       Component-by-
  No Gold Entry       in Pure Gold        & MC in Gold         to Pure Gold         Component
  Gold: 0.000g       MC & Stones         Stones & Tax         Cash: ₹ 0.00         Selection &
  Cash: Full ₹         in Cash             in Cash            Gold: Full g        Split Payment
```

#### Preset 1: `FIX` (100% Cash / Rupee Billing)
- **Business Rule:** The client purchases the jewellery on a fixed rupee contract. No gold metal is exchanged.
- **Gold Ledger Delta:** `0.000 g`
- **Cash Ledger Delta:** Full `Grand Total` (Taxable Value + 3% GST).
- *Ideal For:* Retail-style billing, clients without bullion accounts, or fixed-rate forward contracts.

#### Preset 2: `B2B_WITHOUT_MC` (Standard Wholesale Bullion B2B)
- **Business Rule:** Client pays the pure gold weight and the 3% Gold GST in **physical fine gold metal**. Making charges, gemstones, courier/HUID expenses, and non-gold GST are paid in **cash**.
- **Gold Ledger Delta:**
  $$\text{Settled Gold WT} = \text{Total Pure WT} + \left(\frac{\text{Gold GST Amount}}{\text{Effective Gold Rate}}\right)$$
- **Cash Ledger Delta:**
  $$\text{Settled Cash Amount} = \text{MC Value} + \text{Diamond Value} + \text{Stone Value} + \text{Expenses} + \text{Non-Gold GST}$$
- *Ideal For:* Standard B2B wholesale transactions where jewellers exchange metal-for-metal and settle manufacturing charges in rupees.

#### Preset 3: `B2B_WITH_MC` (Making Charges in Gold)
- **Business Rule:** Client settles the gold metal, gold GST, and **making charges** in fine gold metal. Only gemstones, courier/HUID expenses, and non-gold GST are paid in cash.
- **Gold Ledger Delta:**
  $$\text{Settled Gold WT} = \text{Total Pure WT} + \left(\frac{\text{Gold GST Amount}}{\text{Effective Gold Rate}}\right) + \left(\frac{\text{MC Value}}{\text{Effective Gold Rate}}\right)$$
- **Cash Ledger Delta:**
  $$\text{Settled Cash Amount} = \text{Diamond Value} + \text{Stone Value} + \text{Expenses} + \text{Non-Gold GST}$$
- *Ideal For:* Bullion-rich clients who prefer not to disburse cash for labour charges.

#### Preset 4: `ALL_IN_GOLD` (100% Metal Settlement)
- **Business Rule:** Every rupee of the invoice—including diamonds, stones, labour charges, expenses, and all taxes—is converted into fine gold metal equivalent at the agreed gold rate.
- **Gold Ledger Delta:**
  $$\text{Settled Gold WT} = \text{Total Pure WT} + \left(\frac{\text{Grand Total} - \text{Gold Value}}{\text{Effective Gold Rate}}\right)$$
- **Cash Ledger Delta:** `₹ 0.00`
- *Ideal For:* Pure barter contracts, overseas export clearances, or pure bullion dealer exchanges.

#### Preset 5: `CUSTOM` (Component-by-Component & Split Payment)
- **Business Rule:** The operator explicitly chooses the payment medium (`GOLD` or `CASH`) for each of the 6 components:
  1. Gold Metal (can be `GOLD`, `CASH`, or `SPLIT`)
  2. Gold GST (`GOLD` or `CASH`)
  3. Making Charges (`GOLD` or `CASH`)
  4. Stones & Diamonds (`GOLD` or `CASH`)
  5. Additional Expenses (`GOLD` or `CASH`)
  6. Other GST (`GOLD` or `CASH`)
- **Split Gold Option:** Allows entering partial payment in metal grams (e.g. 50 grams paid in metal, balance converted to cash at the agreed gold rate) or entering a partial rupee down payment.

---

### 7. Estimate Financial Lifecycle & Atomic Ledger Postings

Estimates follow a strict two-stage lifecycle to protect ledger integrity:

```
┌─────────────────────────────────┐           Confirm Button           ┌─────────────────────────────────┐
│         DRAFT ESTIMATE          │  ───────────────────────────────>  │       CONFIRMED ESTIMATE        │
│                                 │                                    │                                 │
│ • Local working cost sheet      │                                    │ • Atomic Ledger Posting created │
│ • Can be edited, re-priced      │  <───────────────────────────────  │ • Customer Balances updated     │
│ • Zero impact on customer ledger│           Reopen (Unconfirm)       │ • Immutable Audit Event logged  │
└─────────────────────────────────┘                                    └─────────────────────────────────┘
```

#### 7.1 Draft State (`status: 'DRAFT'`)
- The estimate is a quotation or working sheet.
- It can be modified, re-calculated, or deleted freely.
- **Ledger Impact:** Zero. Customer's `currentWT` and `currentMC` remain unchanged.

#### 7.2 Confirmation & Ledger Posting (`status: 'CONFIRMED'`)
When the manager clicks **Confirm & Post to Ledger**:
1. The engine recalculates the entire sheet to lock in exact totals.
2. A linked `LedgerTransaction` is atomically created:
   - `id`: `tx-est-[estimateId]`
   - `direction`: `ISSUE` (for Sale) or `RECEIPT` (for Purchase)
   - `pureWT`: Signed delta gold weight
   - `totalAmount`: Signed delta cash amount
   - `erpRef`: Linked to Estimate Number (e.g., `EST-2026-1044`)
3. The customer's chronological transaction timeline is recalculated from their opening balances (`openingWT` and `openingMC`).
4. The customer's `currentWT` and `currentMC` are updated immediately in the store and persistent storage.
5. An immutable security audit log entry is written (`CONFIRM_ESTIMATE`).

#### 7.3 Reopening to Draft (`Unconfirm Estimate`)
If a confirmed estimate requires modification:
1. The manager clicks **Reopen Draft**.
2. The linked ledger transaction (`tx-est-[id]`) is surgically removed from the customer's ledger.
3. The customer's historical running balances are recalculated from opening balance without this transaction.
4. The customer's `currentWT` and `currentMC` revert to their exact pre-confirmation values.
5. The estimate status returns to `DRAFT`.
6. An audit log entry is recorded (`UNCONFIRM_ESTIMATE`).

---

### 8. Direct Customer Transactions & Quick Payment Vouchers

In addition to estimate sheets, operators can record standalone receipts, issues, and payments.

#### 8.1 Quick Payment Modal (`TransactionModal.tsx`)
Accessible from the global header's **New Transaction -> Payment (Gold & Cash)** button:
- **Receipt Voucher (`RECEIPT`):**
  - Customer delivers fine gold bars, old gold, or cash/RTGS payment.
  - **Decreases** customer liability (reduces positive balance or increases advance credit).
  - Formulas:
    $$\text{New Pure WT} = \text{Current Pure WT} - \text{Pure WT Received}$$
    $$\text{New Cash} = \text{Current Cash} - \text{Cash Received}$$
- **Payment Voucher (`ISSUE`):**
  - SBG pays out cash or issues gold bars to the customer.
  - **Increases** customer liability (or reduces advance credit).
  - Formulas:
    $$\text{New Pure WT} = \text{Current Pure WT} + \text{Pure WT Issued}$$
    $$\text{New Cash} = \text{Current Cash} + \text{Cash Paid}$$
- **Purity Calculator in Modal:** Allows entering Gross Weight and Touch % (e.g. `10.000 g` at `99.50%` touch = `9.950 g` pure gold).
- **Valuation Equivalent:** Displays real-time rupee equivalent based on the current market gold rate.

#### 8.2 Detailed Ledger Transaction View (`NewTransactionView.tsx`)
Allows entering formal journal lines with itemized Gross Weight, Stone Weight in Carats/Grams, Touch %, Stone Amount, Making Charge Rate, and Making Charge Amount.

---

### 9. Gold & Cash Settlements Engine

When a client wants to settle their outstanding account using a combination of gold bullion and cash at a negotiated spot rate, the **Settlement Engine (`settlementEngine.ts`)** is utilized.

#### 9.1 Settlement Types
1. **`GOLD_ONLY`:** Customer delivers pure gold metal to offset their gold liability.
   - $\Delta \text{WT} = -\text{Gold Received (g)}$
   - $\Delta \text{MC} = ₹ 0.00$
2. **`CASH_ONLY`:** Customer pays cash to offset their making charge / rupee liability.
   - $\Delta \text{WT} = 0.000 \text{ g}$
   - $\Delta \text{MC} = -\text{Cash Received (₹)}$
3. **`GOLD_AND_CASH`:** Customer delivers both gold metal and cash simultaneously.
   - $\Delta \text{WT} = -\text{Gold Received (g)}$
   - $\Delta \text{MC} = -\text{Cash Received (₹)}$

#### 9.2 Agreed Spot Rate Valuation
The engine computes the gold equivalent valuation:
$$\text{Gold Equivalent Value (₹)} = \text{Gold Received (g)} \times \text{Agreed Gold Rate (₹/g)}$$
This provides transparency on the monetary worth of the metal received during the settlement.

---

### 10. Customer KYC & Profile Ledgers

The Customer Module manages accounts, KYC information, and detailed commercial transaction ledgers.

#### 10.1 Customer KYC & Opening Balances
Each customer record contains:
- Unique System Code (e.g. `SBG-C101`, `SBG-C102`)
- Name, Phone, Email, Address, City
- **GSTIN** (15-character Goods & Services Tax Identification Number)
- **Opening Pure Gold Balance (`openingWT` in grams):** Can be positive (customer owes gold) or negative (customer had an opening advance).
- **Opening Cash Balance (`openingMC` in ₹):** Opening rupee position.
- **Credit Limits:** `creditLimitWT` (max gold grams allowed) and `creditLimitMC` (max rupee credit).

#### 10.2 Profile Sub-Tabs
When viewing a Customer Profile (`CustomerProfileView.tsx`):
1. **GC Account (`gc_account`):**
   - The dual-ledger table displaying Date, Issue/Receipt, Particulars, Reference, Gross WT, Stone WT, Net WT, Touch %, Pure WT, Stone Amount, MC Amount, Total Amount, Running Cash Balance, and Running Pure WT Balance.
   - Supports Google Sheets visual styling.
   - **Google Sheets Bulk Import:** Allows pasting tab-separated or CSV data directly from external spreadsheets. Supports Excel accounting formats (e.g., `(₹2,22,583.00)` parsed as `-222583.00`). Offers option to replace existing transactions or append.
2. **Cash Ledger (`ledger`):**
   - Commercial chronological statement showing all confirmed estimates (full invoice billings) and payment transactions, maintaining a unified running cash balance.
3. **Estimates (`estimates`):**
   - Filtered view of all estimates created for this customer, showing status, gross weight, pure weight, grand total, and direct navigation links.

---

### 11. Commercial Orders & Manufacturing Unit Tracking

The Orders Module (`OrdersView.tsx`, `OrderDetailsView.tsx`) tracks manufacturing batches and job orders linked to retail clients or workshop artisans.

#### 11.1 Order Fields
- Order Number (e.g. `ORD-2026-101`)
- Customer Link
- Order Date & Delivery Date
- Client Job Reference & ERP Manufacturing Reference (e.g. `RD/BB/094/26-27`)
- Item Description (e.g., `18K Diamond Castings & Bangles`)
- Target Gross Weight (`g`) & Target Purity (e.g., `91.6%` or `76.0%`)
- Status Workflow: `PENDING` $\rightarrow$ `IN_PRODUCTION` $\rightarrow$ `COMPLETED` $\rightarrow$ `SETTLED` (or `CANCELLED`)

#### 11.2 Linkage to Estimates
Once production is completed, an estimate can be generated directly from or linked to the order reference, carrying forward the customer and ERP manufacturing numbers.

---

### 12. Financial & Commercial Reports

The Reports Module (`ReportsView.tsx`) provides five exportable commercial registers:
1. **Customer Balance Statement (`CUSTOMER_BALANCES`):**
   - Comprehensive summary of all customer accounts, showing Customer Code, Name, Phone, City, Opening Gold, Opening Cash, Current Pure Gold Balance, and Current Cash Balance.
2. **Customer Ledger Register (`CUSTOMER_LEDGER`):**
   - Complete line-by-line journal of all ledger transactions across the business or filtered by specific customer and date range.
3. **Order Summary Register (`ORDER_COMMERCIAL`):**
   - Operational register of all commercial orders, target weights, delivery deadlines, and completion statuses.
4. **Estimate & Cost Register (`ESTIMATE_REGISTER`):**
   - Register of all estimates created, showing date, customer, status, total pure gold, taxable value, GST, and grand total.
5. **Settlement Register (`SETTLEMENT_REGISTER`):**
   - Record of all spot rate settlements completed, detailing gold received, cash received, agreed gold rate, and resulting balances.

*Export Capabilities:* All reports support instant **CSV Export** and formatted **Browser Print**.

---

### 13. Security, Roles, Audit Trail & System Settings

#### 13.1 User Roles & Access Hierarchy
SBG implements three distinct roles:
1. **`ADMIN`:**
   - Full unrestricted access across all views, system settings, user management, and database synchronization.
2. **`STAFF`:**
   - Access to Dashboard, Customers, Estimates, and Settings (for gold rate updates and profile management). Restricted from Users and Access Management.
3. **`CLIENT`:**
   - External customer portal view restricted strictly to their own Dashboard, Customer Profile, and Estimates.

#### 13.2 Immutable Audit Trail (`AuditView.tsx`)
Every critical commercial action is permanently recorded in the system audit log with:
- Timestamp (ISO 8601)
- User Name and User ID
- Module (`LEDGER`, `ESTIMATES`, `SETTLEMENTS`, `CUSTOMERS`, `ORDERS`, `USERS`, `SETTINGS`)
- Action Key (e.g., `CONFIRM_ESTIMATE`, `UNCONFIRM_ESTIMATE`, `CREATE_SETTLEMENT`, `ADD_TRANSACTION`, `UPDATE_GOLD_RATE`)
- Record Reference ID
- Plain-English Event Details

#### 13.3 System Settings & Master Parameters (`SettingsView.tsx`)
- **Master Market Gold Rate:** Baseline fine gold rate per gram (₹/g).
- **Default GST Rate:** Standard 3.0%.
- **Company Profile:** Company Name (`SBG Enterprises & Jewellery Corp`) and Company GSTIN (`27AAACR9910K1Z4`).
- **Official Bank Details:** Account Name, Bank Name, Account Number, IFSC Code, Branch. Displayed on all printed invoices.
- **Database Synchronization:** Refresh local state from Supabase or reset local cache.

---

### 14. Invoice & Print Layout Specifications

The Estimate Details View (`EstimateDetailsView.tsx`) renders the luxury print invoice. Following user directives, the invoice adheres to the following layout standards:

1. **Header Section:**
   - **Left:** Official Company Logo and Name.
   - **Company GSTIN:** Prominently positioned alongside company identifiers.
   - **Right:** Estimate Number, Date, Customer Reference, and Order Reference.
2. **Customer Block:**
   - Customer Name and City / State.
   - **Customer GSTIN:** Displayed cleanly alongside the customer name.
   - *Customer internal system code (e.g. `SBG-C102`) is hidden from print output.*
3. **Itemized Table:**
   - Serial Number, Item Description, Category, Pieces (`Nos`), Gross Weight, Stone Weight, Net Weight, Touch %, Pure Gold Weight, Applied Rate & Unit, and Line Amount (₹).
   - Expandable breakdown of child sub-items (Diamonds, Precious Stones, Labour).
4. **Totals & Material Valuation Summary Box:**
   - Left side: Itemized Valuation Summary:
     - Gold Metal Value
     - Diamond & Gemstone Value
     - Making Charges Value
     - Additional Expenses (HUID / Courier)
     - Taxable Value
     - GST (3%)
     - **Grand Total (₹)**
   - Right side: **Settlement & Dual-Ledger Adjustment Preview**:
     - Selected Preset (`FIX`, `B2B_WITHOUT_MC`, `B2B_WITH_MC`, `ALL_IN_GOLD`, or `CUSTOM`)
     - Fine Gold Grams posted to Gold Ledger (`g`)
     - Cash Amount posted to Cash Ledger (`₹`)
     - Previous Customer Balances $\rightarrow$ New Customer Balances
5. **Bank & Authorization Section:**
   - Company Bank Details (Bank Name, A/C No, IFSC Code, Account Name).
   - Single **Authorized Signatory** box on the bottom right.

---

### 15. Removed Features & Items Requiring Confirmation

To ensure strict fidelity to the single source of truth in the current code, the following features have been inspected and catalogued:

#### 15.1 Confirmed Removed Features (Do Not Document as Active)
The following visual elements and sections were present in legacy prototypes but have been intentionally removed and are **not active**:
1. **Wholesale Subtitle Banner:** *"WHOLESALE BULLION & FINE ORNAMENTS • ZAVERI BAZAAR, MUMBAI"* has been removed from print headers.
2. **Customer Code Badge in Header:** Internal code badges like `SBG-C102` are removed from customer invoice headers.
3. **Ledger Status Bar:** The badge *"Ledger Status: Confirmed & Posted Dual-Ledger Sync"* has been removed from invoice footers.
4. **Middle Amount in Words & GSTIN Banner:** Replaced by direct top-header GSTIN placement.
5. **Customer Signature Box:** The dual signature layout was replaced with a single Company Authorized Signatory block.
6. **Terms & Conditions Section:** Removed from the estimate print footer.

#### 15.2 Inactive / Unlinked Features Requiring Confirmation
1. **ERP Reconciliation View (`src/views/ERPReconciliationView.tsx`):**
   - *Status:* Exists as a standalone component in the codebase but is **not registered in the active routing table in `App.tsx`** or the sidebar navigation.
   - *Observation:* This view contains UI for comparing manufacturing stock-out entries with commercial ledger records and resolving discrepancies.
   - *Recommendation:* Requires business confirmation whether this should be connected to the sidebar navigation or remains a future roadmap module.
2. **Credit Limit Hard-Blocking:**
   - *Status:* Customer records contain `creditLimitWT` and `creditLimitMC` fields. Currently, these limits are informational and display in customer profiles, but do not hard-block confirmed estimate creation if exceeded.
   - *Recommendation:* Requires confirmation whether strict over-limit blocking should be enabled for operators.
