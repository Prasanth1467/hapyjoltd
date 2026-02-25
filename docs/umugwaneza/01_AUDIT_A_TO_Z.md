# UMUGWANEZA LTD – Full Audit A–Z

Production-ready audit for building the UMUGWANEZA web app on the **same Supabase DB** as Hapyjo (mobile app). Theme aligned with Hapyjo: background `#f8fafc`, primary `#2563eb`, neutral, professional.

**Terminology:** In UI and docs, do **not** use "Driver" or "Driver–Machine" for people who operate machines. Use **"Operators"** only.

---

## A. Database Strategy (Same DB)

| Item | Decision |
|------|----------|
| Schema | Use **PostgreSQL schema `umugwaneza`** for all UMUGWANEZA tables. Do not create these tables in `public` (avoids clash with Hapyjo `vehicles`, `reports`, etc.). |
| Migrations | Store in repo (e.g. `supabase/migrations/umugwaneza/` or prefixed `20250624100000_umugwaneza_*.sql`) and run in the same Supabase project. |
| Extensions | `uuid-ossp` or `gen_random_uuid()`; enable in DB if not already. |

---

## B. Tables to Create (in schema `umugwaneza`)

- **businesses** – id, name, currency (default RWF), created_at, updated_at  
- **users** – id, business_id FK, auth_user_id (auth.users.id), email, full_name, role CHECK (OWNER), is_active, created_at, updated_at  
- **items** – id, business_id FK, item_name, measurement_type (WEIGHT/VOLUME), base_unit (KG/LITRE), is_active, created_at, updated_at  
- **suppliers** – id, business_id FK, supplier_name, phone, address, notes, created_at, updated_at  
- **customers** – id, business_id FK, customer_name, phone, address, notes, created_at, updated_at  
- **purchases** – id, business_id FK, supplier_id FK, reference_no, purchase_date, total_quantity, unit, unit_price, total_purchase_cost, amount_paid, remaining_amount, financial_status (PENDING/PARTIAL/FULLY_SETTLED), created_at, updated_at. Index (business_id, purchase_date).  
- **sales** – id, business_id FK, customer_id FK, reference_no, sale_date, total_quantity, unit, unit_price, total_sale_amount, amount_received, remaining_amount, financial_status (PENDING/PARTIAL/FULLY_RECEIVED), created_at, updated_at. Index (business_id, sale_date).  
- **grocery_payments** – id, business_id FK, reference_type (PURCHASE/SALE), reference_id, amount, payment_date, mode, notes, created_at. Index (business_id, payment_date).  
- **vehicles** – id, business_id FK, **hapyjo_vehicle_id** (TEXT, nullable, link to public.vehicles.id for sync), vehicle_name, vehicle_type (TRUCK/MACHINE), rental_type (DAY/HOUR), ownership_type (OWN/EXTERNAL), registration_number, capacity, base_rate, current_status (AVAILABLE/RENTED_OUT/RENTED_IN/MAINTENANCE/OFFLINE), current_location, notes, created_at, updated_at. Index (business_id, current_status), index (hapyjo_vehicle_id).  
- **external_asset_owners** – id, business_id FK, owner_name, phone, address, notes, created_at, updated_at  
- **rental_contracts** – id, business_id FK, vehicle_id FK, rental_direction (OUTGOING/INCOMING), customer_id FK nullable, external_owner_id FK nullable, rental_start_datetime, rental_end_datetime, rate, total_amount, amount_paid, remaining_amount, financial_status, operational_status (ACTIVE/COMPLETED/CANCELLED), location, notes, created_at, updated_at. Indexes: (business_id, rental_start_datetime), (vehicle_id, rental_start_datetime, rental_end_datetime), (vehicle_id, operational_status).  
- **rental_payments** – id, business_id FK, rental_contract_id FK, amount, payment_date, mode, notes, created_at. Index (business_id, payment_date).  
- **audit_logs** (optional but recommended) – id, business_id FK, user_id, action, entity_type, entity_id, old_value JSONB, new_value JSONB, created_at  

**Note:** If one purchase or sale can have multiple items, add line-item tables (e.g. purchase_lines, sale_lines) and keep purchase/sale as header; otherwise single-item per transaction is fine.

---

## C. Vehicle Sync (Same DB as Hapyjo)

- **Goal:** The same physical fleet is visible and usable in both Hapyjo (mobile) and UMUGWANEZA (web).  
- **Link:** `umugwaneza.vehicles.hapyjo_vehicle_id` = `public.vehicles.id`.  
- **Sync direction:** Hapyjo → UMUGWANEZA (when vehicles are created/updated in `public.vehicles`, update or insert into `umugwaneza.vehicles`).  
- **Implementation:** Either (1) a DB trigger on `public.vehicles` that upserts into `umugwaneza.vehicles` with the correct `business_id`, or (2) an Edge Function or scheduled job that reads `public.vehicles` and upserts into `umugwaneza.vehicles`.  
- **Business mapping:** Decide which `business_id` synced vehicles belong to (e.g. one default business, or a mapping from site_id to business_id). Use this when inserting/updating `umugwaneza.vehicles`.  
- **Optional:** Site-to-business mapping table if multiple businesses and sites need different mappings.

---

## D. Row Level Security (RLS)

- Enable RLS on **all** tables in `umugwaneza`.  
- Policy pattern: `USING (business_id = current_user_business_id())`.  
- Provide a secure way to get `current_user_business_id()`: e.g. RPC that returns `business_id` from `umugwaneza.users` where `auth_user_id = auth.uid()`.  
- System Admin: separate table (e.g. `umugwaneza.system_admins`) or app_metadata; in RLS, allow full access for that role where needed.  

---

## E. Overlap Prevention (Rentals)

- Before insert (and optionally update) of `rental_contracts`, enforce overlap check **in DB** (trigger or RPC):  
  - Same `vehicle_id`, `operational_status IN ('ACTIVE','MAINTENANCE')`, and  
  - `existing_start < new_end AND existing_end > new_start` → reject.  
- Index on (vehicle_id, rental_start_datetime, rental_end_datetime) for performance.  

---

## F. Stock Engine

- No physical `stock` table. Stock = **derived**: SUM(purchases.total_quantity) − SUM(sales.total_quantity) per item (and business_id). Implement as view or server-side query (RPC or Edge Function).  

---

## G. Payment Engine

- Payments only **add** to `amount_paid` (grocery_payments / rental_payments). Recompute `remaining_amount` and update `financial_status` (PENDING/PARTIAL/FULLY_*) in trigger or application logic.  
- Rule: payment cannot exceed total; remaining = total − paid.  
- Profit = Total Sales − Total Purchases; payment status does **not** affect profit.  

---

## H. Auth Flow (Web App)

1. User signs in with Supabase Auth (same project as Hapyjo).  
2. Web app resolves `business_id`: e.g. `SELECT business_id FROM umugwaneza.users WHERE auth_user_id = auth.uid() LIMIT 1` (via RPC or server).  
3. Store `business_id` in session/context; all data queries filter by `business_id`.  
4. System Admin: can create businesses and link owners; cannot access business financial data.  

---

## I. API Surface (Supabase + Edge Functions)

- **CRUD** via Supabase client for: items, suppliers, customers, purchases, sales, vehicles, external_asset_owners, rental_contracts; RLS enforces business_id.  
- **Reports:** Daily, Monthly, Custom, Purchase, Sales, Profit, Outstanding payables/receivables, Stock summary, Supplier ledger, Customer ledger, Rental outgoing, Rental incoming, Vehicle utilization, Rental profit. Implement as Edge Functions or Postgres RPCs; accept business_id (from session), date range, optional filters; all aggregations **server-side**.  
- **CSV export:** Server-side; filename format `UMUGWANEZA_LTD_ReportType_YYYY-MM-DD.csv`.  

---

## J. Report Types (Final List)

**Grocery:** Daily report, Monthly report, Custom date range report, Purchase report, Sales report, Profit report, Outstanding payables, Outstanding receivables, Stock summary, Supplier ledger, Customer ledger.  

**Rental:** Rental outgoing report, Rental incoming report, Vehicle utilization report, Rental profit report.  

**Unified Daily Report:** One report for a selected date showing **Purchases + Sales + Rentals** in one table: columns Date, Type (Purchase / Sale / Rental Out / Rental In), Reference, Party, Item/Vehicle, Quantity, Total, Paid, Remaining, Status; summary row: Total purchases, Total sales, Total rental revenue, Total rental cost, Net profit.  

All queries: `WHERE business_id = current_user.business_id` (and date/entity filters). Summary row: server-calculated totals. Pagination for large data.  

---

## K. CSV Export

- Header row, data rows, final TOTAL row.  
- Currency: column header e.g. `Total Amount (RWF)`; cells numeric only (no symbols).  
- File naming: `UMUGWANEZA_LTD_ReportType_YYYY-MM-DD.csv` (or with date range for custom).  
- Generated server-side; pagination for large result sets.  

---

## L. UI/Theme (Match Hapyjo)

- Background: `#f8fafc`, Surface: `#ffffff`, Primary: `#2563eb`, Text: `#1e293b`, Text secondary: `#64748b`, Border: `#e2e8f0`.  
- Clean, neutral, professional; no flashy animations.  
- Reports: filters at top; data table; last row = bold, light grey background (#f1f5f9), labeled TOTAL.  
- Mobile responsive.  

---

## M. Production Readiness

- Pagination for large reports.  
- Indexed queries (business_id, dates, vehicle_id for overlap).  
- Error handling and validation (stock availability, payment overflow, overlap) on backend.  
- No frontend-only financial calculations; all summaries server-calculated.  
- Audit log for critical actions (rental create, payment, overrides).  

---

## N. Rent Due / Payment Due Notifications (Umugwaneza **website** only)

- **Scope:** This behaviour is for the **Umugwaneza web app**, not the Hapyjo Android app.
- When rental end date or payment due date is within **3 days**, the **owner** must be notified **every day** until the due date.
- **Implement in the website backend:** e.g. Edge Function or cron that reads `umugwaneza.rental_contracts` and `umugwaneza.rental_payments`, and inserts into **`umugwaneza.notifications`** (or the web app’s notifications table) for the owner.
- **Website UI:** Show notifications in the **notification tab at the top right**. When the user clicks **“Clear all notifications”**, **hard-delete** those notifications in the DB (e.g. `DELETE` from `umugwaneza.notifications` for that user/business) so they are removed permanently.

## O. What Not to Do

- Do not create UMUGWANEZA tables in `public` with same names as Hapyjo (vehicles, reports).  
- Do not rely on frontend-only overlap or payment validation.  
- Do not expose cross-business data; always enforce business_id in RLS and API.  
- Do **not** use "Driver" or "Driver–Machine" in UI or docs for people who operate machines; use **"Operators"** only.  

---

## P. Same-DB Checklist

- [ ] Create schema `umugwaneza` in same Supabase project.  
- [ ] Run all UMUGWANEZA migrations (tables, indexes, RLS, triggers, overlap check).  
- [ ] Add `hapyjo_vehicle_id` to `umugwaneza.vehicles` and implement vehicle sync (trigger or job).  
- [ ] Configure Supabase client in web app to use `schema: 'umugwaneza'` where needed (or RPCs in that schema).  
- [ ] Define business mapping for synced vehicles (default business_id or site→business).  
- [ ] At least one business and one owner user seeded for testing.  

Use **02_REPLIT_MASTER_PROMPT.md** for one long Replit prompt and **03_STEPS_TO_BUILD.md** for ordered build steps.
