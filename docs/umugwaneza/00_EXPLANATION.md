# UMUGWANEZA LTD – Explanation: Same DB, Two Apps, and Sync

## 1. What You Have Today

- **Hapyjo** – Mobile app (Android, Expo/React Native) for site/vehicle/trip/survey/expense management (construction and field operations).
- **Supabase** – One project: one database, one Auth, one URL and anon key.
- **Hapyjo schema** – All in `public`: `profiles`, `sites`, `vehicles`, `trips`, `expenses`, `surveys`, `issues`, `tasks`, `operations`, `reports`, etc. No `business_id`; access is role-based (admin, owner, head_supervisor, operators, etc.).
- **Terminology:** Use **"Operators"** (not "Driver" or "Driver–Machine") for people who operate machines, in both Hapyjo and UMUGWANEZA UI and docs.

## 2. What UMUGWANEZA Is

- **UMUGWANEZA LTD** – Web app (B2B wholesale trading and fleet rental). Domains: items, suppliers, customers, purchases, sales, grocery payments, rental vehicles, rental contracts, rental payments. **Multi-tenant by `business_id`**. Only **Owner** role inside a business (plus optional System Admin at platform level).

## 3. Same DB – What It Means

- **Same Supabase project** = same PostgreSQL database, same `auth.users`, same URL and anon key.
- **Two apps:**
  - **Hapyjo** (mobile) → uses `public` schema.
  - **UMUGWANEZA** (web) → uses schema **`umugwaneza`** so table names do not clash with Hapyjo.

## 4. Why a Separate Schema for UMUGWANEZA

- **Different table structures:**
  - **Hapyjo `public.vehicles`:** linked to `sites`, fuel, mileage, type truck/machine (field operations).
  - **UMUGWANEZA vehicles:** linked to `business_id`, rental (DAY/HOUR), OWN/EXTERNAL, base_rate, current_status, current_location (rental business).
  - **Hapyjo `public.reports`:** financial/operations/site_performance, JSONB.
  - **UMUGWANEZA reports:** daily/monthly/custom, purchases, sales, profit, outstanding, ledgers, stock, rental reports – different structure.

So UMUGWANEZA uses its **own tables** in schema `umugwaneza`. You do **not** reuse Hapyjo tables directly; you keep the two data models separate but in the same DB.

## 5. Correct Approach: Schema `umugwaneza`

- Create a **second PostgreSQL schema** in the same DB: **`umugwaneza`**.
- Put all UMUGWANEZA tables there: `umugwaneza.businesses`, `umugwaneza.users`, `umugwaneza.items`, `umugwaneza.vehicles`, `umugwaneza.rental_contracts`, etc.
- **Benefit:** No name clash with `public.vehicles`, `public.reports`, etc. Same DB, same backup, same Supabase project.

## 6. Vehicle Sync (Same DB)

You want the **same physical fleet** to be usable in both apps: vehicles added or updated in Hapyjo (mobile) should appear or stay in sync for UMUGWANEZA (web), using the same DB.

- **Link column:** In `umugwaneza.vehicles` add **`hapyjo_vehicle_id`** (e.g. `TEXT`, nullable) referencing `public.vehicles.id`.
- **Sync direction:** Typically **Hapyjo → UMUGWANEZA**: when a vehicle is created or updated in `public.vehicles`, create or update the corresponding row in `umugwaneza.vehicles` (with the same identity via `hapyjo_vehicle_id`).
- **How to sync:**
  - **Option A – DB trigger:** On `public.vehicles` INSERT/UPDATE, insert or update `umugwaneza.vehicles` (you need a rule for `business_id`, e.g. one default business or a site→business mapping).
  - **Option B – App/Edge Function:** A job or “Sync vehicles” action that reads `public.vehicles` and upserts into `umugwaneza.vehicles` using `hapyjo_vehicle_id`.
- **Business mapping:** Decide which UMUGWANEZA `business_id` the synced vehicles belong to (single business or site→business mapping). Apply that when writing to `umugwaneza.vehicles`.

So: **same DB, vehicle sync = keep `umugwaneza.vehicles` in sync with `public.vehicles` via `hapyjo_vehicle_id` and a trigger or sync job.**

## 7. What Is Shared vs Separate

| Item               | Shared? | Notes                                                                 |
|--------------------|--------|-----------------------------------------------------------------------|
| Supabase URL/Key   | Yes    | Same project for both apps.                                          |
| Auth (auth.users)  | Yes    | Same login pool. One user can have a Hapyjo profile and a UMUGWANEZA user row. |
| public.* tables    | No     | Used only by Hapyjo (mobile).                                        |
| umugwaneza.* tables| No     | Used only by UMUGWANEZA (web).                                       |
| Vehicle data       | Synced | Via `hapyjo_vehicle_id` and trigger or sync job; same DB.             |
| RLS                | Per app| Hapyjo: role from `public.profiles`. UMUGWANEZA: `business_id` from `umugwaneza.users`. |

## 8. Auth: How Both Apps Coexist

- **Supabase Auth** is shared: one `auth.users` table.
- **Hapyjo:** After login, app loads `public.profiles` (by `auth.uid()`) and uses `role` (admin, owner, operators, etc.).
- **UMUGWANEZA:** After login, web app loads `umugwaneza.users` by `auth_user_id = auth.uid()`, gets `business_id` and role (OWNER). All UMUGWANEZA queries filter by `business_id`. System Admin (platform-only) can be in a small table or app_metadata.

So: **one database, one Auth, two schemas (public + umugwaneza), two apps.** Vehicle sync is done by linking and updating data between `public.vehicles` and `umugwaneza.vehicles` in the same DB.

## 9. Short Summary

- **Same DB** = same Supabase project; UMUGWANEZA tables live in schema **`umugwaneza`**.
- **Schema sync** = run UMUGWANEZA migrations so the `umugwaneza` schema and tables exist and are up to date in that DB.
- **Vehicle sync** = keep vehicle list aligned between Hapyjo and UMUGWANEZA using `hapyjo_vehicle_id` and a trigger or sync job in the same DB.
- **Theme match** = UMUGWANEZA web UI uses the same design tokens as Hapyjo (e.g. background `#f8fafc`, primary `#2563eb`, clean neutral look).

Next: **01_AUDIT_A_TO_Z.md** (full audit including vehicle sync), **02_REPLIT_MASTER_PROMPT.md** (single long prompt for Replit), **03_STEPS_TO_BUILD.md** (ordered build steps).
