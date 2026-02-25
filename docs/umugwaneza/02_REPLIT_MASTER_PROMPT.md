# UMUGWANEZA LTD – One Long Replit Core Build Prompt

Copy the block below and paste into Replit Core (or similar) to build the full web app in one go. The app uses the **same Supabase database** as an existing mobile app (Hapyjo); UMUGWANEZA tables live in schema **umugwaneza** to avoid clashes with `public` tables. **Vehicle sync:** UMUGWANEZA vehicles can be linked to Hapyjo vehicles via `hapyjo_vehicle_id` so the same fleet is visible in both apps. Theme matches the reference site.

---

## Master prompt (copy from line below)

```
Build a production-ready B2B web app "UMUGWANEZA LTD" (Wholesale Trading + Fleet & Machinery Rental) with the following strict requirements.

## Tech stack
- React (Vite or Next.js) + TypeScript.
- Supabase: same project as existing app (Hapyjo); use schema "umugwaneza" for ALL app tables (do not use public for these tables to avoid name clashes). Use Supabase Auth (same auth.users); resolve business_id from umugwaneza.users where auth_user_id = auth.uid().
- UI: responsive web; clean and professional.

## Theme (match reference site – must use these exactly)
- Background: #f8fafc
- Surface/cards: #ffffff
- Primary: #2563eb
- Text primary: #1e293b
- Text secondary: #64748b
- Border: #e2e8f0
- Summary row: bold, background #f1f5f9, label "TOTAL"
- Buttons: primary #2563eb, neutral grays; min touch height 48px; border-radius 8px.
- No flashy animations; neutral, professional; suitable for Rwanda market.

## Terminology
- Use "Operators" for people who operate machines. Do NOT use "Driver" or "Driver–Machine" in UI or labels.

## Database (same Supabase DB, schema umugwaneza)
Create migrations that run in schema "umugwaneza" (CREATE SCHEMA IF NOT EXISTS umugwaneza). Tables:
- businesses (id, name, currency default RWF, created_at, updated_at)
- users (id, business_id FK, auth_user_id, email, full_name, role CHECK IN ('OWNER'), is_active, created_at, updated_at)
- items (id, business_id, item_name, measurement_type WEIGHT/VOLUME, base_unit KG/LITRE, is_active, created_at, updated_at)
- suppliers (id, business_id, supplier_name, phone, address, notes, created_at, updated_at)
- customers (id, business_id, customer_name, phone, address, notes, created_at, updated_at)
- purchases (id, business_id, supplier_id, reference_no, purchase_date, total_quantity, unit, unit_price, total_purchase_cost, amount_paid, remaining_amount, financial_status PENDING/PARTIAL/FULLY_SETTLED, created_at, updated_at). Index (business_id, purchase_date).
- sales (id, business_id, customer_id, reference_no, sale_date, total_quantity, unit, unit_price, total_sale_amount, amount_received, remaining_amount, financial_status PENDING/PARTIAL/FULLY_RECEIVED, created_at, updated_at). Index (business_id, sale_date).
- grocery_payments (id, business_id, reference_type PURCHASE/SALE, reference_id, amount, payment_date, mode, notes, created_at)
- vehicles (id, business_id, hapyjo_vehicle_id TEXT nullable, vehicle_name, vehicle_type TRUCK/MACHINE, rental_type DAY/HOUR, ownership_type OWN/EXTERNAL, registration_number, capacity, base_rate, current_status AVAILABLE/RENTED_OUT/RENTED_IN/MAINTENANCE/OFFLINE, current_location, notes, created_at, updated_at). Index (business_id, current_status), index (hapyjo_vehicle_id). hapyjo_vehicle_id links to public.vehicles.id for vehicle sync from Hapyjo mobile app.
- external_asset_owners (id, business_id, owner_name, phone, address, notes, created_at, updated_at)
- rental_contracts (id, business_id, vehicle_id, rental_direction OUTGOING/INCOMING, customer_id, external_owner_id, rental_start_datetime, rental_end_datetime, rate, total_amount, amount_paid, remaining_amount, financial_status, operational_status ACTIVE/COMPLETED/CANCELLED, location, notes, created_at, updated_at). Indexes: (business_id, rental_start_datetime), (vehicle_id, rental_start_datetime, rental_end_datetime).
- rental_payments (id, business_id, rental_contract_id, amount, payment_date, mode, notes, created_at)
Enable RLS on all; policy: USING (business_id = (SELECT business_id FROM umugwaneza.users WHERE auth_user_id = auth.uid() LIMIT 1)). Add overlap-prevention trigger on rental_contracts: before insert/update check same vehicle_id and operational_status IN ('ACTIVE','MAINTENANCE') and (existing_start < new_end AND existing_end > new_start) then raise exception.

## Vehicle sync (same DB as Hapyjo)
- umugwaneza.vehicles.hapyjo_vehicle_id references public.vehicles.id (same DB).
- Implement sync from public.vehicles to umugwaneza.vehicles: either a DB trigger on public.vehicles (INSERT/UPDATE) that upserts into umugwaneza.vehicles with a defined business_id, or an Edge Function / "Sync vehicles" button that reads public.vehicles and upserts into umugwaneza.vehicles. So the same fleet is visible in both mobile app (Hapyjo) and web (UMUGWANEZA).

## Roles
- System Admin: platform only; creates business + owner; cannot see business financial data.
- Owner: full control inside their business (grocery + rental + payments + reports). Only role inside business.

## Grocery module
- Items: CRUD; measurement_type WEIGHT (store KG) or VOLUME (litres); display ≥100kg as quintals, ≥1000kg as tons.
- Purchases: record supplier, item, quantity, unit price, total, date; stock increases; financial status PENDING/PARTIAL/FULLY_SETTLED; payments in grocery_payments; remaining = total - paid.
- Sales: record customer, item, quantity, unit price, total, date; validate stock; stock decreases; financial status PENDING/PARTIAL/FULLY_RECEIVED; same payment logic.
- Profit = Total Sales − Total Purchases (payment status does not affect profit).

## Rental module
- Vehicle master: CRUD; vehicle_type TRUCK/MACHINE, rental_type DAY/HOUR, ownership_type OWN/EXTERNAL, base_rate, current_status, current_location. In UI refer to machine operators as Operators.
- Outgoing rental: customer, vehicle, start/end datetime, rate; total = days×rate or hours×rate; financial status PENDING/PARTIAL/FULLY_SETTLED; operational_status ACTIVE/COMPLETED/CANCELLED; vehicle status auto RENTED_OUT when active.
- Incoming rental: external owner, vehicle details, start/end, rate, total; same payment tracking; appears in outstanding payables.
- Overlap: block new rental if same vehicle has ACTIVE/MAINTENANCE with overlapping period (existing_start < new_end AND existing_end > new_start). Backend/DB validation mandatory.
- Location: update vehicle current_location when rental starts (customer location) and when ends (base); allow manual override.

## Dashboard (unified)
- Grocery: Total stock, Today sales, Monthly sales, Monthly profit, Outstanding payables, Outstanding receivables.
- Rental: Total vehicles, Available, Rented out, Rented in, Maintenance, Today rental revenue, Monthly rental revenue, Rental outstanding payables/receivables.

## Reports page
- Top: Report type dropdown, Date filter (Daily / Monthly / Custom), From date, To date, optional filters (Item, Supplier, Customer, Vehicle). Buttons: Generate Report, Download CSV.
- Report types: Daily report (unified), Monthly report, Custom date range, Purchase report, Sales report, Profit report, Outstanding payables, Outstanding receivables, Stock summary, Supplier ledger, Customer ledger, Rental outgoing, Rental incoming, Vehicle utilization, Rental profit.
- Daily report (unified): for selected date show ALL purchases + sales + rentals in one table. Columns: Date, Type (Purchase / Sale / Rental Out / Rental In), Reference, Party, Item/Vehicle, Quantity, Total, Paid, Remaining, Status. Summary row TOTAL: Total purchases, Total sales, Total rental revenue, Total rental cost, Net profit.
- Monthly/Custom: same structure; filter by month or from-to; server-side aggregation.
- Ledgers: running balance Balance(n)=Balance(n-1)+Debit−Credit; final row Outstanding balance.
- Stock summary: Item, Total purchased, Total sold, Current stock, Unit; weight in KG + quintals/tons preview; volume in litres.
- All queries MUST filter by business_id; all summaries server-calculated; pagination for large data.

## CSV export
- Filename: UMUGWANEZA_LTD_ReportType_YYYY-MM-DD.csv (or with date range for custom).
- Structure: header row, data rows, final TOTAL row.
- Currency: column header e.g. "Total Amount (RWF)"; cells numeric only, no currency symbols.

## Security
- Every query/API filter by business_id (from umugwaneza.users by auth_user_id).
- Overlap validation and payment validation on backend only.
- No cross-business visibility; audit log for rental create, payment, overrides (optional table audit_logs).

## Production behavior
- Pagination for large reports; indexed queries; proper error handling; backend validation for stock, payment overflow, overlapping rentals; all financial summaries server-calculated.

Build the full app: auth (login/logout, resolve business_id), dashboard, grocery (items, suppliers, customers, purchases, sales, payments), rental (vehicles, external owners, outgoing/incoming contracts, payments), vehicle sync from Hapyjo (same DB), reports page with all report types including unified daily report and CSV download, using the exact theme above and schema umugwaneza in the same Supabase project.
```

---

## After pasting

1. Set environment variables in Replit: `VITE_SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `VITE_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) to the **same** Supabase project used by Hapyjo.
2. Run the UMUGWANEZA migrations (schema `umugwaneza` + all tables including `hapyjo_vehicle_id` on vehicles) in that project’s SQL Editor or via Supabase CLI.
3. Implement vehicle sync: either a trigger on `public.vehicles` that upserts into `umugwaneza.vehicles` with the chosen `business_id`, or an Edge Function / sync action.
4. Create at least one business and one owner user in `umugwaneza.businesses` and `umugwaneza.users` (auth_user_id = a valid auth.users.id from the same project), then log in with that auth user to test.

Theme and behavior match the reference site and the full PRD; DB stays shared; vehicles can sync between Hapyjo (mobile) and UMUGWANEZA (web) via the same DB.
