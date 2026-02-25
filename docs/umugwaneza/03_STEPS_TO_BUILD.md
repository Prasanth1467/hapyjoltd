# UMUGWANEZA LTD – Steps to Build (Ordered)

Follow this order: database first, then API/auth, then UI and reports. Same Supabase DB as Hapyjo (mobile app); all UMUGWANEZA tables in schema **umugwaneza**. Vehicles sync between Hapyjo and UMUGWANEZA via the same DB.

**Terminology:** Use **"Operators"** (not "Driver" or "Driver–Machine") for machine operators everywhere in UI and docs.

---

## Phase 1: Database (Same DB, New Schema)

### Step 1.1 – Create schema and extensions
- In Supabase SQL Editor (same project as Hapyjo):
  - `CREATE SCHEMA IF NOT EXISTS umugwaneza;`
  - Ensure `uuid-ossp` or `gen_random_uuid()` is available.

### Step 1.2 – Core and auth tables
- Create in **umugwaneza**:
  - `businesses` (id, name, currency default 'RWF', created_at, updated_at)
  - `users` (id, business_id FK → businesses, auth_user_id, email, full_name, role CHECK ('OWNER'), is_active, created_at, updated_at)
- Index: `users(business_id)`, `users(auth_user_id)`.

### Step 1.3 – Grocery tables
- Create in **umugwaneza**:
  - `items` (id, business_id, item_name, measurement_type, base_unit, is_active, created_at, updated_at)
  - `suppliers`, `customers`
  - `purchases` (with financial_status, amount_paid, remaining_amount; index business_id, purchase_date)
  - `sales` (with financial_status, amount_received, remaining_amount; index business_id, sale_date)
  - `grocery_payments` (reference_type, reference_id, amount, payment_date, mode, notes; index business_id, payment_date)

### Step 1.4 – Rental tables (with vehicle sync link)
- Create in **umugwaneza**:
  - `vehicles` (include **hapyjo_vehicle_id** TEXT nullable for link to public.vehicles.id; vehicle_type, rental_type, ownership_type, base_rate, current_status, current_location; index business_id, current_status; index hapyjo_vehicle_id)
  - `external_asset_owners`
  - `rental_contracts` (rental_direction, customer_id, external_owner_id, rental_start/end_datetime, rate, total_amount, amount_paid, remaining_amount, financial_status, operational_status; indexes for business_id+date and vehicle_id+dates for overlap)
  - `rental_payments`

### Step 1.5 – Vehicle sync (same DB)
- Implement sync from **public.vehicles** (Hapyjo) to **umugwaneza.vehicles** (UMUGWANEZA):
  - **Option A:** DB trigger on `public.vehicles` AFTER INSERT/UPDATE that inserts or updates `umugwaneza.vehicles` (set hapyjo_vehicle_id = NEW.id, and set business_id from a config or site→business mapping).
  - **Option B:** Edge Function or "Sync vehicles" action that reads `public.vehicles` and upserts into `umugwaneza.vehicles` with the chosen business_id and hapyjo_vehicle_id.
- Define business mapping: which business_id do synced vehicles belong to (e.g. one default business, or a mapping table site_id → business_id).

### Step 1.6 – Overlap prevention
- Trigger (or RPC) on `rental_contracts`: before insert/update, run overlap check (same vehicle_id, operational_status IN ('ACTIVE','MAINTENANCE'), existing_start < new_end AND existing_end > new_start). If match, raise exception.

### Step 1.7 – RLS
- Enable RLS on all **umugwaneza** tables.
- Policy: `USING (business_id = (SELECT business_id FROM umugwaneza.users WHERE auth_user_id = auth.uid() LIMIT 1))`.
- Add WITH CHECK for insert/update. System Admin: separate policy or app-level only (e.g. service role or dedicated admin table).

### Step 1.8 – Payment and status triggers (optional but recommended)
- On grocery_payments insert: update parent purchase/sale amount_paid, remaining_amount, financial_status.
- On rental_payments insert: update rental_contract amount_paid, remaining_amount, financial_status.
- On rental_contracts: when operational_status becomes ACTIVE, set vehicle current_status = RENTED_OUT (or RENTED_IN); when COMPLETED/CANCELLED, set vehicle current_status = AVAILABLE (or as per business rule).

---

## Phase 2: Auth and App Bootstrap

### Step 2.1 – Create web project
- React (Vite or Next.js) + TypeScript; install `@supabase/supabase-js`.

### Step 2.2 – Supabase client
- Same URL and anon key as Hapyjo. When querying UMUGWANEZA tables, use schema option: e.g. `.schema('umugwaneza')` or call RPCs that run in `umugwaneza`.

### Step 2.3 – Auth flow
- Login/signup with Supabase Auth (same project).
- After login: fetch `business_id` from `umugwaneza.users` where `auth_user_id = auth.uid()` (via RPC or direct select with RLS). Store in app context/state.
- Logout: clear session and context.

### Step 2.4 – Seed first business and owner (manual or script)
- Insert one row into `umugwaneza.businesses`.
- Insert one row into `umugwaneza.users` with that business_id and auth_user_id = a real auth.users.id (e.g. create a test user in Supabase Auth first). Then log in with that user in the web app.

---

## Phase 3: Theme and Layout

### Step 3.1 – Design tokens
- Apply theme: background #f8fafc, surface #ffffff, primary #2563eb, text #1e293b, #64748b, border #e2e8f0. Summary row #f1f5f9, bold, label "TOTAL".

### Step 3.2 – Layout
- Responsive layout; sidebar or top nav; main content area. Dashboard as home after login.

---

## Phase 4: Grocery Module (UI)

### Step 4.1 – Master data
- Items: list, add, edit (item_name, measurement_type, base_unit).
- Suppliers: list, add, edit.
- Customers: list, add, edit.

### Step 4.2 – Purchases
- List purchases (filter by date, supplier); create purchase (supplier, item, quantity, unit, unit_price, date); total and remaining computed. Record payments (grocery_payments) and show status.

### Step 4.3 – Sales
- List sales (filter by date, customer); create sale (customer, item, quantity, unit, unit_price, date) with stock check; record payments and show status.

### Step 4.4 – Stock
- Stock summary: derived from purchases − sales per item; display in KG with quintals/tons for weight; litres for volume.

---

## Phase 5: Rental Module (UI)

### Step 5.1 – Vehicles
- List, add, edit vehicles (name, type, rental_type, ownership_type, base_rate, current_status, current_location). Show hapyjo_vehicle_id when present (synced from Hapyjo). Optionally expose "Sync vehicles from Hapyjo" if using sync job.

### Step 5.2 – External owners
- List, add, edit external_asset_owners.

### Step 5.3 – Outgoing rentals
- Create contract (customer, vehicle, start/end, rate); auto total; show overlap error from backend; record payments; update vehicle status/location.

### Step 5.4 – Incoming rentals
- Create contract (external owner, vehicle details, start/end, rate, total); record payments; show in outstanding payables.

---

## Phase 6: Dashboard

### Step 6.1 – Grocery section
- Total stock value or count; today sales; monthly sales; monthly profit; outstanding payables; outstanding receivables (from server or RPC).

### Step 6.2 – Rental section
- Total vehicles; available; rented out; rented in; maintenance; today rental revenue; monthly rental revenue; rental outstanding payables/receivables.

---

## Phase 7: Reports and CSV

### Step 7.1 – Reports page layout
- Filters: report type, date filter (Daily/Monthly/Custom), from/to, optional item/supplier/customer/vehicle. Buttons: Generate, Download CSV.

### Step 7.2 – Implement each report type (server-side)
- **Daily report (unified):** For selected date, show all purchases + sales + rentals in one table. Columns: Date, Type (Purchase/Sale/Rental Out/Rental In), Reference, Party, Item/Vehicle, Quantity, Total, Paid, Remaining, Status. Summary row: Total purchases, Total sales, Total rental revenue, Total rental cost, Net profit.
- Monthly, Custom (same structure; filter by month or from-to).
- Purchase, Sales, Profit (Sales − Purchases; payment status does not affect profit).
- Outstanding payables, Outstanding receivables.
- Stock summary (with unit display rules).
- Supplier ledger, Customer ledger (running balance).
- Rental: Outgoing, Incoming, Vehicle utilization, Rental profit.
- All queries filtered by business_id; summary row with totals; pagination.

### Step 7.3 – CSV export
- Server-side; filename UMUGWANEZA_LTD_ReportType_YYYY-MM-DD.csv; header + data + TOTAL row; currency columns with "(RWF)" in header, numeric cells only.

---

## Phase 8: Production Hardening

### Step 8.1 – Validation
- Backend: stock check on sale; payment ≤ total; rental overlap check; business_id on every mutation.

### Step 8.2 – Performance
- Pagination on all list and report endpoints; ensure indexes (business_id, dates, vehicle_id) are used.

### Step 8.3 – Audit (optional)
- Log critical actions (rental create, payment, override) to audit_logs table.

---

## Same-DB Checklist

- [ ] Schema `umugwaneza` created in same Supabase project.
- [ ] All UMUGWANEZA migrations run (tables, indexes, RLS, triggers, overlap check).
- [ ] Column `hapyjo_vehicle_id` on `umugwaneza.vehicles`; vehicle sync implemented (trigger or job).
- [ ] Business mapping for synced vehicles defined.
- [ ] Web app uses same Supabase URL/anon key and schema `umugwaneza`.
- [ ] No tables created in `public` that clash with Hapyjo (vehicles, reports, etc.).
- [ ] At least one business and one owner user seeded for testing.

Use **02_REPLIT_MASTER_PROMPT.md** to hand the whole spec to Replit in one go; then follow this file to verify and fill any gaps (migrations, seed data, vehicle sync, System Admin flow).

---

**Demo:** Use these steps as the verification checklist when doing the demo run-through.
