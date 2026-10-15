# Sree Balaji Gold (SBG) Commercial Suite
## Complete Manual Testing Checklist & Verification Matrix

**Document Version:** 2.0  
**Test Suite Coverage:** 100% of Implemented Features, Workflows, Calculations, Validations, and Edge Cases  
**Test Execution Environment:** Web Browser (Chrome / Safari / Firefox / Edge)  
**Status Key:**  
- `[ ] PENDING`: Not yet tested  
- `[X] PASS`: Test passed successfully with expected results  
- `[!] FAIL`: Test failed (discrepancy logged in notes)  

---

### Summary Test Matrix

| Module ID | Module Name | Total Cases | Pass | Fail | Pending |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **MOD-01** | Authentication & Session Management | 6 | 0 | 0 | 6 |
| **MOD-02** | Header, Navigation & Live Gold Rate Engine | 7 | 0 | 0 | 7 |
| **MOD-03** | Commercial Dashboard & KPI Metrics | 6 | 0 | 0 | 6 |
| **MOD-04** | Customer KYC Directory & Master Data | 7 | 0 | 0 | 7 |
| **MOD-05** | Customer Profile, Dual-Ledger & Sheet Import | 8 | 0 | 0 | 8 |
| **MOD-06** | Commercial Orders & Production Tracking | 6 | 0 | 0 | 6 |
| **MOD-07** | Dual-Ledger Transaction Management | 7 | 0 | 0 | 7 |
| **MOD-08** | Quick Payment & Receipt Voucher Modal | 6 | 0 | 0 | 6 |
| **MOD-09** | Estimate Cost Sheet Calculation Engine | 8 | 0 | 0 | 8 |
| **MOD-10** | Estimate Settlement Presets Engine | 7 | 0 | 0 | 7 |
| **MOD-11** | Estimate Lifecycle & Atomic Financial Postings | 6 | 0 | 0 | 6 |
| **MOD-12** | Estimate Invoice Details & Print Output | 8 | 0 | 0 | 8 |
| **MOD-13** | Gold & Cash Spot Rate Settlements | 6 | 0 | 0 | 6 |
| **MOD-14** | Commercial Reports & CSV Export Registers | 6 | 0 | 0 | 6 |
| **MOD-15** | Immutable Audit Trail & Data Integrity | 5 | 0 | 0 | 5 |
| **MOD-16** | Users, Roles & Access Control | 6 | 0 | 0 | 6 |
| **MOD-17** | Settings, Company GSTIN & Bank Details | 6 | 0 | 0 | 6 |
| **MOD-18** | Edge Cases, Precision & Boundary Conditions | 7 | 0 | 0 | 7 |
| **TOTAL** | **Comprehensive End-to-End Suite** | **118** | **0** | **0** | **118** |

---

### Detailed Test Cases by Module

#### Module 1: Authentication & Session Management (`MOD-01`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-AUTH-01** | Successful Admin Login | Logged out state | 1. Navigate to base URL.<br>2. Enter admin username and password.<br>3. Click "Sign In". | Username: `sreebalajigold@gmail.com`<br>Password: `password` | User is authenticated and redirected to Dashboard. Current user badge shows "ADMIN". | `[ ] PENDING` | |
| **TC-AUTH-02** | Invalid Password Rejection | Logged out state | 1. Enter valid username with wrong password.<br>2. Click "Sign In". | Username: `sreebalajigold@gmail.com`<br>Password: `wrongpass` | Error message displayed: "Invalid username or password. Please verify your credentials." Login fails. | `[ ] PENDING` | |
| **TC-AUTH-03** | Password Visibility Toggle | Logged out state | 1. Type password in password field.<br>2. Click the eye icon button. | Password: `secretpassword` | Password input changes from masked (`••••••`) to clear text and back upon toggle. | `[ ] PENDING` | |
| **TC-AUTH-04** | Password Reset Modal Workflow | Logged out state | 1. Click "Forgot your password?".<br>2. Enter registered email.<br>3. Enter new password and confirmation.<br>4. Submit. | Email: `sreebalajigold@gmail.com`<br>New Pass: `newpass123`<br>Confirm: `newpass123` | Success banner displays, modal closes, user can immediately login with the new password. | `[ ] PENDING` | |
| **TC-AUTH-05** | Session Persistence on Page Reload | User logged in | 1. Log in successfully.<br>2. Press browser Refresh (F5 / Cmd+R). | N/A | User remains logged in on the active tab without being kicked back to login screen. | `[ ] PENDING` | |
| **TC-AUTH-06** | Secure User Logout | User logged in | 1. Click user avatar on top-right.<br>2. Click "Sign Out". | N/A | Session clears from localStorage (`sbg_auth`). User is immediately redirected to Login view. | `[ ] PENDING` | |

---

#### Module 2: Header, Navigation & Live Gold Rate Engine (`MOD-02`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-NAV-01** | Desktop Sidebar Navigation | Admin user | 1. Click each sidebar item: Dashboard, Customers, SBG Estimates, Audit & Security, Users & Access, Settings. | N/A | View updates smoothly with URL parameter `?tab=...` and correct page content rendered. | `[ ] PENDING` | |
| **TC-NAV-02** | Sidebar Collapse & Expand Toggle | Desktop viewport | 1. Click the collapse arrow icon next to sidebar.<br>2. Verify collapsed icon-only state.<br>3. Click expand icon. | N/A | Sidebar collapses smoothly, main content expands; state persists across page reload (`sbg_sidebar_collapsed`). | `[ ] PENDING` | |
| **TC-NAV-03** | Role-Based Navigation Filtering | Staff / Client login | 1. Log in as STAFF user.<br>2. Check sidebar items.<br>3. Log in as CLIENT user. | Staff user<br>Client user | Staff sees Dashboard, Customers, Estimates, Settings.<br>Client sees only Dashboard, Customers, Estimates. | `[ ] PENDING` | |
| **TC-NAV-04** | Live Gold Rate Ticker Display | Dashboard open | 1. Observe gold rate pill in header.<br>2. Check purity dropdown (24KT, 22KT, 18KT, 14KT, 99.5%). | Purity options | Displayed rate adjusts according to formula: $\text{Rate} = \text{Base Rate} \times \left(\frac{\text{Purity}}{100}\right)$. Live indicator pulses green. | `[ ] PENDING` | |
| **TC-NAV-05** | Live Rate Manual Refresh | Dashboard open | 1. Click the Sparkles/Refresh icon on rate badge in header. | N/A | Trigger fetches live spot price from online API or applies latest ticker rate; timestamp updates. | `[ ] PENDING` | |
| **TC-NAV-06** | Manual Market Gold Rate Override | Settings or Rate Modal | 1. Click rate pill to open edit modal.<br>2. Enter new rate value (e.g. ₹ 7,500.00/g).<br>3. Click Save. | Rate: `7500.00` | Market rate updates across all headers, estimate builders, and valuation widgets immediately. | `[ ] PENDING` | |
| **TC-NAV-07** | Notification Center & Clear Badge | Unread alerts exist | 1. Observe notification bell badge counter.<br>2. Click bell to open popup.<br>3. View alerts and close. | Notification badge | Badge counter immediately resets to zero upon opening. Notifications persist in read state. | `[ ] PENDING` | |

---

#### Module 3: Commercial Dashboard & KPI Metrics (`MOD-03`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-DASH-01** | Active Customers Metric Card | Dashboard open | 1. Check "Active Customers" KPI card count.<br>2. Click the card. | Customer count | Card displays exact count of `ACTIVE` customers. Clicking navigates to Customers view (`?tab=customers`). | `[ ] PENDING` | |
| **TC-DASH-02** | Open Commercial Orders Metric Card | Dashboard open | 1. Check "Open Commercial Orders" count.<br>2. Click the card. | Open orders | Displays orders in `PENDING` or `IN_PRODUCTION`. Clicking navigates to Orders view (`?tab=orders`). | `[ ] PENDING` | |
| **TC-DASH-03** | Net Pure Gold Outstanding Card | Dashboard open | 1. Read pure gold total grams.<br>2. Check INR equivalent value.<br>3. Verify formula: $\text{Grams} \times \text{Rate}$. | Customer pure gold balances | Card shows sum of all customer `currentWT` to 3 decimals. INR shows $\text{Pure WT} \times \text{Market Gold Rate}$. | `[ ] PENDING` | |
| **TC-DASH-04** | Net MC Balance Outstanding Card | Dashboard open | 1. Read net Making Charge currency card.<br>2. Click the card. | Customer cash balances | Displays sum of all customer `currentMC` to 2 decimals. Clicking navigates to Ledger view. | `[ ] PENDING` | |
| **TC-DASH-05** | Customer Outstanding Table on Dashboard | Dashboard open | 1. Inspect table of customer balances.<br>2. Click a customer row. | Customer rows | Displays customer code, name, pure gold balance, and cash balance. Clicking row opens Customer Profile. | `[ ] PENDING` | |
| **TC-DASH-06** | Recent Activity & Quick Action Cards | Dashboard open | 1. Inspect Recent Estimates and Recent Transactions widgets.<br>2. Click "New Estimate" quick button. | N/A | Shows latest 3 estimates and transactions. Quick action button navigates to `new-estimate` view. | `[ ] PENDING` | |

---

#### Module 4: Customer KYC Directory & Master Data (`MOD-04`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-CUST-01** | Add New Customer Account | Customers view open | 1. Click "Add Customer".<br>2. Fill Name, Phone, Email, City, Address, GSTIN.<br>3. Set Opening Pure WT and Opening MC.<br>4. Save. | Name: `Suraj Jewellers`<br>Phone: `9820011223`<br>GSTIN: `27ABCDE1234F1Z5`<br>Opening WT: `10.500`<br>Opening MC: `25000` | New customer created with auto-code (e.g. `SBG-C105`). Current balances initialized to opening values. | `[ ] PENDING` | |
| **TC-CUST-02** | Customer Phone Number Validation | Add customer modal | 1. Enter invalid phone number with alphabets or less than 10 digits.<br>2. Attempt to save. | Phone: `123abc` | Validation error shown. Customer cannot be saved with invalid phone. | `[ ] PENDING` | |
| **TC-CUST-03** | Customer Search Functionality | Customers view open | 1. Type name, phone, or customer code in search bar. | Query: `TIKVAH` or `944` | Customer list filters dynamically in real-time matching code, name, city, or phone number. | `[ ] PENDING` | |
| **TC-CUST-04** | Customer Status Filter | Customers view open | 1. Select "ACTIVE" from status filter.<br>2. Select "INACTIVE". | Status: `ACTIVE` / `INACTIVE` | Table displays only customers matching the selected active or inactive status. | `[ ] PENDING` | |
| **TC-CUST-05** | Edit Customer Details | Customers view open | 1. Click edit button on existing customer.<br>2. Update address or GSTIN.<br>3. Save. | GSTIN: `27AAACR1234K1Z9` | Customer record updates in table and persistent storage without altering historical balances. | `[ ] PENDING` | |
| **TC-CUST-06** | Negative Opening Balances (Advance) | Add customer modal | 1. Enter negative Opening Pure WT and negative Opening MC.<br>2. Save. | Opening WT: `-50.000`<br>Opening MC: `-100000.00` | Customer saved with advance balances showing in green/advance indicator (`-50.000 g` and `-₹ 1,00,000.00`). | `[ ] PENDING` | |
| **TC-CUST-07** | Export Customers to CSV | Customers view open | 1. Click "Export CSV" button in header. | N/A | Browser downloads `SBG_Customers_List_[Date].csv` with all columns properly formatted. | `[ ] PENDING` | |

---

#### Module 5: Customer Profile, Dual-Ledger & Sheet Import (`MOD-05`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-PROF-01** | Dual-Ledger GC Account Tab | Customer profile open | 1. Click "GC Account (Gold & Cash)" tab.<br>2. Inspect table columns and running balances. | Customer with transactions | Displays Gross WT, Stone WT, Net WT, Touch %, Pure WT, MC, Running Pure WT, and Running MC. | `[ ] PENDING` | |
| **TC-PROF-02** | Google Sheet Visual Theme Toggle | GC Account tab | 1. Toggle the "Google Sheets View" checkbox / switch. | Switch toggle | Table styles shift to Google Sheets spreadsheet format with compact borders and cell highlights. | `[ ] PENDING` | |
| **TC-PROF-03** | Cash-Only Ledger Tab | Customer profile open | 1. Click "Cash-Only Ledger" tab.<br>2. Inspect chronological timeline. | Confirmed estimates & payments | Shows opening cash balance, all confirmed estimates (issues), and payment vouchers (receipts) with running balance. | `[ ] PENDING` | |
| **TC-PROF-04** | Customer Estimates Tab | Customer profile open | 1. Click "Estimates" tab.<br>2. Inspect estimate cards. | Linked estimates | Displays all customer estimates with status pill, gross weight, pure weight, and grand total. | `[ ] PENDING` | |
| **TC-PROF-05** | Google Sheet Bulk Import - Template Download | Profile open | 1. Click "Import from Sheet" button.<br>2. Click "Download Template CSV". | N/A | Browser downloads `SBG_Customer_Ledger_Bulk_Import_Template.csv` containing expected column headers. | `[ ] PENDING` | |
| **TC-PROF-06** | Google Sheet Bulk Import - Accounting Format | Import modal open | 1. Paste CSV/tab data containing Excel accounting parentheses like `(₹2,22,583.00)`.<br>2. Click Preview. | Text with `(₹2,22,583.00)` and `-16.421` | Engine correctly parses parentheses as negative values `-222583.00` and displays green/red indicators. | `[ ] PENDING` | |
| **TC-PROF-07** | Google Sheet Bulk Import - Replace vs Append | Import modal open | 1. Select "Replace all existing transactions".<br>2. Confirm import.<br>3. Inspect customer ledger. | 5 valid rows | Previous transactions replaced, historical running balances recalculated cleanly from customer opening balance. | `[ ] PENDING` | |
| **TC-PROF-08** | Single Transaction Deletion & Balance Recalculation | GC Account tab | 1. Click Delete (trash icon) on any non-estimate transaction.<br>2. Confirm deletion. | Transaction ID | Transaction removed; subsequent transactions' running balances recalculate immediately. | `[ ] PENDING` | |

---

#### Module 6: Commercial Orders & Production Tracking (`MOD-06`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-ORD-01** | Create New Manufacturing Order | Orders view open | 1. Click "New Order".<br>2. Select customer, set description, target weight, target purity.<br>3. Save. | Cust: `TIKVAH`<br>Desc: `18K Bangles`<br>Target WT: `50.000 g`<br>Purity: `76.0%` | Order created with status `IN_PRODUCTION`. Order number generated (e.g. `ORD-2026-103`). | `[ ] PENDING` | |
| **TC-ORD-02** | Order Status Progression | Order details open | 1. Change status from `IN_PRODUCTION` to `COMPLETED`.<br>2. Change status to `SETTLED`. | Status dropdown | Status badge updates, audit log records status change event. | `[ ] PENDING` | |
| **TC-ORD-03** | Order Search & Filter | Orders view open | 1. Search by Order Number or ERP reference.<br>2. Filter by status (`COMPLETED`). | Query: `ORD-2026-` | Orders table filters to show matching records accurately. | `[ ] PENDING` | |
| **TC-ORD-04** | Order Details View & Metadata | Orders view open | 1. Click on an order row. | Order ID | Details screen displays customer KYC, target weight, purity, delivery deadline, and linked transactions. | `[ ] PENDING` | |
| **TC-ORD-05** | Order Linkage in New Estimate | New Estimate view | 1. Open New Estimate.<br>2. Select Order from the "Linked Order" dropdown. | Order: `ORD-2026-101` | Customer and order reference pre-fill into the estimate cost sheet automatically. | `[ ] PENDING` | |
| **TC-ORD-06** | Cancelled Order Workflow | Order details open | 1. Set status to `CANCELLED`.<br>2. Verify appearance in orders list. | Status: `CANCELLED` | Order shows gray/red cancelled badge and is excluded from active open order KPI metrics. | `[ ] PENDING` | |

---

#### Module 7: Dual-Ledger Transaction Management (`MOD-07`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-TX-01** | Record Gold Issue Transaction | New Transaction view | 1. Select Customer, Direction `ISSUE`, Particulars `SALE`.<br>2. Gross: 20.000g, Stone: 2.000g, Touch: 91.6%.<br>3. Save. | Gross: `20.000`<br>Stone: `2.000`<br>Touch: `91.6` | Net WT = `+18.000 g`, Pure WT = `+16.488 g`. Customer `currentWT` increases by `16.488 g`. | `[ ] PENDING` | |
| **TC-TX-02** | Record Gold Receipt Transaction | New Transaction view | 1. Select Direction `RECEIPT`, Particulars `PURCHASE`.<br>2. Gross: 10.000g, Stone: 0g, Touch: 99.5%.<br>3. Save. | Gross: `10.000`<br>Stone: `0`<br>Touch: `99.5` | Net WT = `-10.000 g`, Pure WT = `-9.950 g`. Customer `currentWT` decreases by `9.950 g`. | `[ ] PENDING` | |
| **TC-TX-03** | Carats to Grams Conversion in Line Item | New Transaction view | 1. Enter Stone Weight in Carats: `5.000 ct`.<br>2. Check Stone Weight in Grams field. | Carats: `5.000 ct` | Automatically converts to `1.000 g` ($5.000 \times 0.200$). Net weight subtracts `1.000 g`. | `[ ] PENDING` | |
| **TC-TX-04** | Making Charge (MC) Rate per Gram Calculation | New Transaction view | 1. Enter Net WT: 15.000 g.<br>2. Enter MC Rate: ₹ 450.00/g. | Net: `15.000 g`<br>Rate: `450` | MC Amount = $15.000 \times 450 = ₹ 6,750.00$. Signs apply according to direction. | `[ ] PENDING` | |
| **TC-TX-05** | Multi-Line Transaction Entry | New Transaction view | 1. Click "Add Another Item" to create 3 line items.<br>2. Fill each line.<br>3. Submit batch. | 3 line items | All 3 lines are created in the ledger, with chronological running balances correctly chained. | `[ ] PENDING` | |
| **TC-TX-06** | Ledger View Multi-Column Filters | Ledger view open | 1. Filter by Customer: `TIKVAH`.<br>2. Filter by Direction: `RECEIPT`.<br>3. Filter by Particulars: `PURCHASE`. | Filter combination | Table displays only records matching all active filter criteria. Clear button resets all. | `[ ] PENDING` | |
| **TC-TX-07** | Ledger Batch Selection & Counter | Ledger view open | 1. Click checkboxes on 4 transaction rows.<br>2. Check header selection count. | 4 rows selected | Header shows "4 transactions selected" with total selected Net WT and Total MC summarized. | `[ ] PENDING` | |

---

#### Module 8: Quick Payment & Receipt Voucher Modal (`MOD-08`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-PAY-01** | Open Quick Payment Modal | Any view | 1. Click "New Transaction" pill in header.<br>2. Select "Payment (Gold & Cash)". | N/A | Modal opens with customer selector, voucher type tabs (`RECEIPT` / `PAYMENT`), and date. | `[ ] PENDING` | |
| **TC-PAY-02** | Customer Gold Receipt Voucher | Modal open | 1. Type: `RECEIPT`.<br>2. Gold Weight: `25.000 g`, Touch: `99.50%`.<br>3. Leave cash blank.<br>4. Submit. | Gold: `25.000`<br>Touch: `99.50` | Pure WT = `24.875 g`. Customer `currentWT` liability decreases by `24.875 g`. Cash unchanged. | `[ ] PENDING` | |
| **TC-PAY-03** | Customer Cash Receipt Voucher | Modal open | 1. Type: `RECEIPT`.<br>2. Cash Amount: `₹ 50,000.00`.<br>3. Leave gold blank.<br>4. Submit. | Cash: `50000.00` | Customer `currentMC` liability decreases by `₹ 50,000.00`. Pure gold unchanged. | `[ ] PENDING` | |
| **TC-PAY-04** | Dual Gold + Cash Receipt Voucher | Modal open | 1. Type: `RECEIPT`.<br>2. Gold: `10.000 g` (99.5%), Cash: `₹ 25,000.00`.<br>3. Submit. | Gold: `10.000 g`<br>Cash: `25000.00` | Pure WT decreases by `9.950 g`, and cash liability decreases by `₹ 25,000.00` simultaneously. | `[ ] PENDING` | |
| **TC-PAY-05** | Payment (Issue) Voucher to Customer | Modal open | 1. Select `PAYMENT` (Issue out).<br>2. Cash: `₹ 15,000.00`.<br>3. Submit. | Cash: `15000.00` | Customer liability increases by `₹ 15,000.00` (or advance deposit reduces by ₹ 15,000.00). | `[ ] PENDING` | |
| **TC-PAY-06** | Modal Escape Key Dismissal | Modal open | 1. Press `Escape` key on keyboard. | Key: `Escape` | Modal closes immediately without saving or altering ledger data. | `[ ] PENDING` | |

---

#### Module 9: Estimate Cost Sheet Calculation Engine (`MOD-09`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-EST-01** | Single Line Item Plain Gold Jewellery | New Estimate open | 1. Gold Rate: ₹ 7,200.00.<br>2. Item: 22K Ring, Gross: 10.000g, Stone: 0, Touch: 91.6%.<br>3. Rate Unit: `PER_G`. | Gross: `10.000`<br>Touch: `91.6`<br>Rate: `7200` | Net WT = `10.000 g`, Pure WT = `9.160 g`. Amount = $9.160 \times 7200 = ₹ 65,952.00$. | `[ ] PENDING` | |
| **TC-EST-02** | Gemstone Carats Calculation in Line Item | New Estimate open | 1. Gross: 15.000g, Stone WT: 4.500 ct, Unit: `ct`.<br>2. Rate: ₹ 2,000.00/ct. | Stone: `4.500 ct`<br>Rate: `2000` | Stone Grams = $4.500 \times 0.200 = 0.900 \text{ g}$. Net WT = `14.100 g`. Amount = $4.500 \times 2000 = ₹ 9,000.00$. | `[ ] PENDING` | |
| **TC-EST-03** | Composite Jewellery with Child Sub-Items | New Estimate open | 1. Line: Diamond Bangle.<br>2. Sub-Item 1: Gold Casting 18K (12g, 76% touch).<br>3. Sub-Item 2: Diamonds (2.50 ct at ₹ 45,000/ct).<br>4. Sub-Item 3: Making Charges (12g at ₹ 600/g). | Composite inputs | Sub-items total rollup correctly into parent line amount. Stone weight automatically deducted from net gold. | `[ ] PENDING` | |
| **TC-EST-04** | Master Defaults Propagation to Lines | New Estimate open | 1. Set Master Diamond Rate: ₹ 40,000/ct.<br>2. Set Master MC Rate: ₹ 550/g.<br>3. Add Diamond sub-item. | Master rates set | Newly added Diamond sub-item automatically defaults to ₹ 40,000/ct without manual entry. | `[ ] PENDING` | |
| **TC-EST-05** | Additional Expenses Inclusion | New Estimate open | 1. Enter HUID Charges: ₹ 180.00.<br>2. Enter Courier Charges: ₹ 750.00.<br>3. Check Taxable Value. | HUID: `180`<br>Courier: `750` | Total Expenses = ₹ 930.00. Taxable Value increases by exact ₹ 930.00. | `[ ] PENDING` | |
| **TC-EST-06** | 3.0% Jewellery GST Calculation | New Estimate open | 1. Taxable Value: ₹ 1,00,000.00.<br>2. Check GST Amount.<br>3. Check Grand Total. | Taxable: `100000.00` | GST Amount (3%) = ₹ 3,000.00. Grand Total = ₹ 1,03,000.00. | `[ ] PENDING` | |
| **TC-EST-07** | Component-Level GST Split Verification | New Estimate open | 1. Gold Value: ₹ 80,000.00.<br>2. Non-Gold (MC + Diamonds): ₹ 20,000.00.<br>3. Total GST: ₹ 3,000.00. | Values entered | Gold GST = $80,000 \times 0.03 = ₹ 2,400.00$. Non-Gold GST = $20,000 \times 0.03 = ₹ 600.00$. Total = ₹ 3,000.00. | `[ ] PENDING` | |
| **TC-EST-08** | Purchase Transaction Type (Old Gold Receipt) | New Estimate open | 1. Select Transaction Type: `PURCHASE` (Receipt).<br>2. Gross: 50.000g, Touch: 76%. | Type: `PURCHASE` | Direction sets to `RECEIPT` (multiplier -1). Delta values show negative liability to customer. | `[ ] PENDING` | |

---

#### Module 10: Estimate Settlement Presets Engine (`MOD-10`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-PRE-01** | Preset: `FIX` (100% Cash Settlement) | Estimate sheet open | 1. Select Preset: `FIX`.<br>2. Inspect Settlement Preview. | Grand Total: `₹ 1,54,500.00`<br>Pure WT: `18.320 g` | Settled Gold WT = `0.000 g`. Settled Cash Amount = `₹ 1,54,500.00` (100% of bill in cash). | `[ ] PENDING` | |
| **TC-PRE-02** | Preset: `B2B_WITHOUT_MC` (Standard Wholesale) | Estimate sheet open | 1. Select Preset: `B2B_WITHOUT_MC`.<br>2. Gold Rate: ₹ 7,000.00.<br>3. Gold GST: ₹ 3,500.00.<br>4. Pure WT: 15.000 g. | Rates entered | Gold GST in Gold = $3500 / 7000 = 0.500 \text{ g}$. Settled Gold = $15.000 + 0.500 = 15.500 \text{ g}$. MC & Tax in Cash. | `[ ] PENDING` | |
| **TC-PRE-03** | Preset: `B2B_WITH_MC` (Making Charges in Gold) | Estimate sheet open | 1. Select Preset: `B2B_WITH_MC`.<br>2. Pure WT: 15.000g, Gold GST in Gold: 0.500g.<br>3. MC: ₹ 7,000.00 (Gold Rate ₹ 7,000/g). | MC: `7000.00`<br>Rate: `7000.00` | MC in Gold = $7000 / 7000 = 1.000 \text{ g}$. Settled Gold = $15.000 + 0.500 + 1.000 = 16.500 \text{ g}$. | `[ ] PENDING` | |
| **TC-PRE-04** | Preset: `ALL_IN_GOLD` (100% Barter Gold) | Estimate sheet open | 1. Select Preset: `ALL_IN_GOLD`.<br>2. Grand Total: ₹ 1,40,000.00.<br>3. Gold Rate: ₹ 7,000.00. | Grand Total: `140000`<br>Rate: `7000` | Settled Cash Amount = `₹ 0.00`. Total Settled Gold = $140,000 / 7,000 = 20.000 \text{ g}$. | `[ ] PENDING` | |
| **TC-PRE-05** | Preset: `CUSTOM` - Split Gold Payment (Metal Grams) | Estimate sheet open | 1. Select `CUSTOM`.<br>2. Gold Mode: `SPLIT`.<br>3. Pure Gold Total: 20.000 g.<br>4. Enter Paid in Metal: `15.000 g`. | Paid Metal: `15.000 g`<br>Gold Rate: `₹ 7,000` | Settled Gold = `15.000 g`. Unpaid 5.000g converted to cash = $5.000 \times 7000 = ₹ 35,000.00$ added to Cash. | `[ ] PENDING` | |
| **TC-PRE-06** | Preset: `CUSTOM` - Split Gold Payment (Rupee Advance) | Estimate sheet open | 1. Select `CUSTOM`.<br>2. Gold Mode: `SPLIT`.<br>3. Enter Down Payment in Cash: `₹ 70,000.00` at rate ₹ 7,000/g. | Down Payment: `₹ 70,000` | Metal paid equivalent = $70000 / 7000 = 10.000 \text{ g}$. Balances allocate correctly. | `[ ] PENDING` | |
| **TC-PRE-07** | Preset Change Dynamic Recalculation | Estimate sheet open | 1. Switch preset from `FIX` to `B2B_WITHOUT_MC` to `ALL_IN_GOLD`. | Preset switching | Preview table updates immediately without page reload or numerical lag. | `[ ] PENDING` | |

---

#### Module 11: Estimate Lifecycle & Atomic Financial Postings (`MOD-11`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-LIFE-01** | Save Estimate as Draft | New Estimate view | 1. Fill estimate items and select customer.<br>2. Click "Save Draft". | Valid estimate | Estimate saved with status `DRAFT`. Customer ledger balances (`currentWT` & `currentMC`) remain 100% unchanged. | `[ ] PENDING` | |
| **TC-LIFE-02** | Confirm Estimate & Atomic Ledger Posting | Draft estimate open | 1. In Estimate Details, click "Confirm & Post to Ledger".<br>2. Confirm modal prompt. | Draft Estimate | Status updates to `CONFIRMED`. Atomic `LedgerTransaction` created. Customer balances update immediately. | `[ ] PENDING` | |
| **TC-LIFE-03** | Customer Ledger Verification Post-Confirmation | Customer profile | 1. Open customer's GC Account tab.<br>2. Check latest transaction entry. | Customer ID | Linked transaction displays estimate number, signed Pure WT delta, signed Total MC delta, and updated running balance. | `[ ] PENDING` | |
| **TC-LIFE-04** | Reopen Estimate (Unconfirm) Rollback | Confirmed estimate | 1. Click "Reopen Draft" on confirmed estimate.<br>2. Confirm modal prompt. | Confirmed Estimate | Status reverts to `DRAFT`. Linked transaction deleted. Customer historical balances recalculated to pre-confirmation state. | `[ ] PENDING` | |
| **TC-LIFE-05** | Delete Draft Estimate | Estimates view | 1. Click delete on a `DRAFT` estimate.<br>2. Confirm deletion. | Draft Estimate | Estimate removed from list. No ledger impact. | `[ ] PENDING` | |
| **TC-LIFE-06** | Deletion Protection on Confirmed Estimate | Confirmed estimate | 1. Observe delete action on confirmed estimate. | Confirmed Estimate | System prompts warning that linked ledger transaction must be unconfirmed first or automatically unlinks it safely. | `[ ] PENDING` | |

---

#### Module 12: Estimate Invoice Details & Print Output (`MOD-12`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-PRINT-01** | Print Layout Trigger | Estimate details open | 1. Click "Print" button on estimate details header. | Estimate sheet | Browser print dialog triggers with clean, styled A4 print stylesheet. | `[ ] PENDING` | |
| **TC-PRINT-02** | Company GSTIN Header Verification | Print preview | 1. Inspect top header. | Company GSTIN: `27AAACR9910K1Z4` | Company GSTIN is clearly visible and aligned alongside company name/logo. | `[ ] PENDING` | |
| **TC-PRINT-03** | Customer GSTIN & Details Block | Print preview | 1. Inspect Customer section. | Customer with GSTIN | Customer Name, City, and Customer GSTIN appear cleanly formatted. | `[ ] PENDING` | |
| **TC-PRINT-04** | Verification of Removed Customer Code | Print preview | 1. Inspect Customer section. | Customer `SBG-C102` | Customer internal system code (`SBG-C102`) is **NOT** displayed anywhere in customer print block. | `[ ] PENDING` | |
| **TC-PRINT-05** | Verification of Removed Wholesale Subtitle | Print preview | 1. Inspect company header subtitle. | Header area | Subtitle *"WHOLESALE BULLION & FINE ORNAMENTS • ZAVERI BAZAAR, MUMBAI"* is **NOT** displayed. | `[ ] PENDING` | |
| **TC-PRINT-06** | Verification of Removed Ledger Status Badge | Print preview | 1. Inspect footer and summary boxes. | Footer area | Badge *"Ledger Status: Confirmed & Posted Dual-Ledger Sync"* is **NOT** displayed. | `[ ] PENDING` | |
| **TC-PRINT-07** | Official Bank Details Section | Print preview | 1. Inspect Bank details box on bottom left. | Bank details | Displays Bank Name, Account Name (`SREE BALAJI GOLD`), Account Number, and IFSC code cleanly. | `[ ] PENDING` | |
| **TC-PRINT-08** | Single Authorized Signatory Box | Print preview | 1. Inspect signature section on bottom right. | Bottom right | Displays single "Authorized Signatory" box. Customer signature box is removed. | `[ ] PENDING` | |

---

#### Module 13: Gold & Cash Spot Rate Settlements (`MOD-13`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-SET-01** | Gold Only Settlement | New Settlement view | 1. Select Customer.<br>2. Type: `GOLD_ONLY`.<br>3. Gold Received: 15.000 g.<br>4. Agreed Gold Rate: ₹ 7,200/g.<br>5. Submit. | Gold: `15.000 g`<br>Rate: `7200` | $\Delta \text{WT} = -15.000 \text{ g}$, $\Delta \text{MC} = ₹ 0.00$. Customer `currentWT` liability reduces by 15.000 g. | `[ ] PENDING` | |
| **TC-SET-02** | Cash Only Settlement | New Settlement view | 1. Type: `CASH_ONLY`.<br>2. Cash Received: ₹ 40,000.00.<br>3. Submit. | Cash: `40000.00` | $\Delta \text{WT} = 0.000 \text{ g}$, $\Delta \text{MC} = -₹ 40,000.00$. Customer `currentMC` liability reduces by ₹ 40,000.00. | `[ ] PENDING` | |
| **TC-SET-03** | Gold + Cash Combined Settlement | New Settlement view | 1. Type: `GOLD_AND_CASH`.<br>2. Gold: 10.000g, Cash: ₹ 20,000.00.<br>3. Agreed Rate: ₹ 7,100/g.<br>4. Submit. | Gold: `10.000 g`<br>Cash: `20000.00` | Pure WT reduces by 10.000 g, cash reduces by ₹ 20,000.00. Gold Equivalent Value computed ($10 \times 7100 = ₹ 71,000$). | `[ ] PENDING` | |
| **TC-SET-04** | Real-time Settlement Impact Preview | New Settlement view | 1. Adjust gold or cash input values in the form. | Inputs changing | "New Balance WT" and "New Balance MC" preview cards update live as values are typed. | `[ ] PENDING` | |
| **TC-SET-05** | Settlements Register Listing | Settlements view open | 1. Open Settlements tab. | Settlements list | Lists all recorded settlements with Settlement No (`SET-YYYY-XXXX`), Date, Customer, Type, Gold, and Cash. | `[ ] PENDING` | |
| **TC-SET-06** | Settlement Navigation to Customer Profile | New Settlement view | 1. Submit a settlement. | Form submitted | Upon submission, user is automatically redirected to the updated Customer Profile view showing new balances. | `[ ] PENDING` | |

---

#### Module 14: Commercial Reports & CSV Export Registers (`MOD-14`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-REP-01** | Customer Balance Statement Report | Reports view open | 1. Select "Customer Balance Statement".<br>2. Verify displayed balances. | Registered customers | Displays all customers, opening gold, opening cash, current pure gold, current cash, and active status. | `[ ] PENDING` | |
| **TC-REP-02** | Customer Balance CSV Export | Reports view open | 1. In Customer Balance report, click "Export CSV". | N/A | Browser downloads `SBG_Report_CUSTOMER_BALANCES_[Date].csv` with all numerical columns intact. | `[ ] PENDING` | |
| **TC-REP-03** | Customer Ledger Register Report | Reports view open | 1. Select "Ledger Register".<br>2. Filter by specific customer.<br>3. Filter date range. | Customer & Date range | Displays filtered chronological journal lines for the customer within selected dates. | `[ ] PENDING` | |
| **TC-REP-04** | Order Commercial Register | Reports view open | 1. Select "Order Summary Register". | Orders data | Displays all orders with targets, deadlines, ERP references, and manufacturing status. | `[ ] PENDING` | |
| **TC-REP-05** | Estimate & Cost Register Report | Reports view open | 1. Select "Estimate & Cost Register". | Estimates data | Lists all estimates with estimate number, date, customer, status, taxable value, GST, and grand total. | `[ ] PENDING` | |
| **TC-REP-06** | Settlement Register Report | Reports view open | 1. Select "Settlement Register". | Settlements data | Lists all spot settlements with gold received, cash received, and agreed gold rate. | `[ ] PENDING` | |

---

#### Module 15: Immutable Audit Trail & Data Integrity (`MOD-15`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-AUD-01** | Audit Trail Event Logging | Perform any action | 1. Create a customer or confirm an estimate.<br>2. Navigate to Audit & Security view. | Action performed | Audit view contains new row with Timestamp, Current User, Module, Action (`CONFIRM_ESTIMATE`), and Details. | `[ ] PENDING` | |
| **TC-AUD-02** | Audit Module Filter | Audit view open | 1. Filter by Module: `ESTIMATES`.<br>2. Filter by Module: `LEDGER`. | Module dropdown | Audit table displays only events belonging to the selected module. | `[ ] PENDING` | |
| **TC-AUD-03** | Audit Search Filter | Audit view open | 1. Type specific estimate number or user name into search bar. | Search query: `EST-2026-` | Audit logs filter in real-time matching the entered search string. | `[ ] PENDING` | |
| **TC-AUD-04** | Event Details Transparency | Audit view open | 1. Inspect Event Details column for a confirmed estimate. | Confirmed estimate row | Shows exact gold weight and cash amount posted to the ledger in plain English. | `[ ] PENDING` | |
| **TC-AUD-05** | Notification Badge Sync with Audit | Audit view open | 1. Observe notification bell when entering Audit view. | Bell badge | Notification count clears and marks items as read when audit view is inspected. | `[ ] PENDING` | |

---

#### Module 16: Users, Roles & Access Control (`MOD-16`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-USER-01** | Create Staff User Account | Users view open | 1. Click "Add User".<br>2. Enter Name, Email, Username, Role: `STAFF`, Password.<br>3. Save. | Role: `STAFF`<br>Username: `staff1` | Staff user created and listed in table with `ACTIVE` status badge. | `[ ] PENDING` | |
| **TC-USER-02** | Create Client User Account Linked to Customer | Users view open | 1. Click "Add User".<br>2. Select Role: `CLIENT`.<br>3. Select linked customer from dropdown.<br>4. Save. | Role: `CLIENT`<br>Customer: `TIKVAH` | Client account created and strictly linked to customer `TIKVAH`. | `[ ] PENDING` | |
| **TC-USER-03** | Edit User Profile & Password | Users view open | 1. Click edit on existing user.<br>2. Change password.<br>3. Save. | New password | Password updated. User can log in with new password immediately. | `[ ] PENDING` | |
| **TC-USER-04** | Disable User Account | Users view open | 1. Edit user and set Status: `DISABLED`.<br>2. Attempt login as that user. | Status: `DISABLED` | Login fails with disabled account notification. | `[ ] PENDING` | |
| **TC-USER-05** | Delete User Account | Users view open | 1. Click delete on a non-admin user.<br>2. Confirm deletion. | User ID | User account removed from system. Cannot delete primary admin account. | `[ ] PENDING` | |
| **TC-USER-06** | Role Permission Enforcement | Logged in as Staff | 1. Inspect sidebar.<br>2. Attempt to navigate directly to `?tab=users`. | URL: `?tab=users` | Access restricted. Users view is hidden from Staff and Client roles. | `[ ] PENDING` | |

---

#### Module 17: Settings, Company GSTIN & Bank Details (`MOD-17`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-SETT-01** | Master Gold Rate Setting | Settings view open | 1. Update Market Gold Rate to ₹ 7,350.00/g.<br>2. Click Save. | Rate: `7350.00` | Rate updates across all estimates and live header indicators. | `[ ] PENDING` | |
| **TC-SETT-02** | Default GST Rate Setting | Settings view open | 1. Inspect GST rate field.<br>2. Verify standard 3.0%. | GST: `3.0%` | GST field correctly maintains 3.0% standard jewellery tax rate. | `[ ] PENDING` | |
| **TC-SETT-03** | Update Company Profile & GSTIN | Settings view open | 1. Change Company Name or Company GSTIN.<br>2. Click Save. | GSTIN: `27AAACR9910K1Z4` | Updates company details. New GSTIN displays on all estimate invoice headers immediately. | `[ ] PENDING` | |
| **TC-SETT-04** | Update Official Bank Details | Settings view open | 1. Update Bank Name, Account No, IFSC, Account Name.<br>2. Click Save. | Account: `50200088992211`<br>IFSC: `HDFC0000123` | Bank details update in storage and render on all estimate print invoices. | `[ ] PENDING` | |
| **TC-SETT-05** | Database Refresh & Sync Status | Settings view open | 1. Inspect Sync Status card.<br>2. Click "Refresh from Database". | Live connection | Triggers sync refresh from Supabase (or confirms local offline-first status cleanly). | `[ ] PENDING` | |
| **TC-SETT-06** | User Password Change in Settings | Settings view open | 1. Enter new password and confirm password in "Change Password" card.<br>2. Click "Update Password". | New password | Password updates with success alert banner; feedback disappears after 4 seconds. | `[ ] PENDING` | |

---

#### Module 18: Edge Cases, Precision & Boundary Conditions (`MOD-18`)

| Test ID | Test Scenario | Prerequisites | Step-by-Step Test Actions | Test Data | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-EDGE-01** | 3-Decimal Gold Weight Rounding (Epsilon Test) | Estimate line item | 1. Gross WT: `10.5555 g`.<br>2. Inspect rounded weight in system. | Input: `10.5555` | Rounded strictly to `10.556 g` without floating-point drift. | `[ ] PENDING` | |
| **TC-EDGE-02** | Stone Weight Equal to Gross Weight | Estimate line item | 1. Gross WT: `5.000 g`, Stone WT: `5.000 g`. | Gross: `5`, Stone: `5` | Net WT = `0.000 g`, Pure WT = `0.000 g`. Amount calculates only on stone/MC value without crashing. | `[ ] PENDING` | |
| **TC-EDGE-03** | Stone Weight Exceeding Gross Weight Protection | Estimate line item | 1. Gross WT: `4.000 g`, Stone WT: `6.000 g`. | Gross: `4`, Stone: `6` | Net WT clamps cleanly to `0.000 g` ($\max(0, \text{Gross} - \text{Stone})$). Never becomes negative. | `[ ] PENDING` | |
| **TC-EDGE-04** | Zero Gold Rate Handling in Presets | Estimate preset | 1. Create estimate with Gold Rate set to `0` or blank.<br>2. Select `B2B_WITHOUT_MC`. | Gold Rate: `0` | System uses fallback rate of 1 to prevent division by zero (`NaN` / `Infinity`). | `[ ] PENDING` | |
| **TC-EDGE-05** | Very High Value Transaction (Crore INR) | Estimate cost sheet | 1. Create estimate with Grand Total > ₹ 1,00,00,000 (1 Crore).<br>2. Check amount in words and balance formatting. | Amount: `₹ 1,50,25,000.00` | Displays correctly formatted in Indian numbering system (`₹ 1,50,25,000.00`) and words. | `[ ] PENDING` | |
| **TC-EDGE-06** | Negative Customer Balances Across Sequential Transactions | Customer ledger | 1. Record customer advance payment of ₹ 5,00,000.<br>2. Record series of 3 smaller confirmed estimates. | Advance: `₹ 5,00,000`<br>Estimates: `₹ 1.5L, ₹ 2L, ₹ 1L` | Running balance tracks negative credit reducing down to `-₹ 50,000.00` accurately. | `[ ] PENDING` | |
| **TC-EDGE-07** | Special Characters in ERP References & Remarks | New transaction / Estimate | 1. Enter reference with slashes, dashes, and hashes (e.g. `RD/BB#094/26-27 & CO.`).<br>2. Save and view in print. | Reference: `RD/BB#094/26-27 & CO.` | String renders cleanly without escaping bugs or layout breaks in table or invoice. | `[ ] PENDING` | |
