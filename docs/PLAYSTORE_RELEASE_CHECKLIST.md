# Play Store release checklist – Hapyjo

Use this the day before / day of release to confirm everything is ready.

---

## 1. Real-time behaviour (notifications and all data)

### How it works

- **MockAppStoreContext** subscribes to Supabase Realtime for 15 tables once the user is logged in (`authUser` present).
- On **any** INSERT/UPDATE/DELETE on those tables, the app runs **refetch()**, which reloads sites, vehicles, expenses, trips, machine_sessions, surveys, issues, site_assignments, driver_vehicle_assignments, tasks, operations, reports, profiles, **and notifications** (by current user role).
- So **notifications are real-time**: when a new row is inserted into `public.notifications` with `target_role` = current user’s role, the Realtime event fires → refetch() runs → notifications are re-queried → the bell badge and list update without leaving the screen.

### Tables that must be in Realtime (Database → Replication)

Ensure these are in the `supabase_realtime` publication (migrations should have added them):

| Table | Migration |
|-------|-----------|
| sites | 20250224100000_realtime_all_tables.sql |
| vehicles | 20250224100000_realtime_all_tables.sql |
| expenses | 20250224100000_realtime_all_tables.sql |
| trips | 20250224100000_realtime_all_tables.sql |
| machine_sessions | 20250224100000_realtime_all_tables.sql |
| surveys | 20250224100000_realtime_all_tables.sql |
| issues | 20250224100000_realtime_all_tables.sql |
| site_assignments | 20250224100000_realtime_all_tables.sql |
| driver_vehicle_assignments | 20250224100000_realtime_all_tables.sql |
| tasks | 20250224100000_realtime_all_tables.sql |
| operations | 20250224100000_realtime_all_tables.sql |
| reports | 20250224100000_realtime_all_tables.sql |
| profiles | 20250224100000_realtime_all_tables.sql |
| gps_photos | 20250222120000_gps_photos_realtime.sql |
| **notifications** | 20250223100000_notifications.sql |

**Quick check in Supabase:** Database → Replication → ensure `public.notifications` (and the other tables above) are in the publication. If any are missing, run the corresponding migration or add the table to the publication.

### Notifications RLS and role

- Notifications RLS uses **current_user_role()** (from profiles / app_role). Ensure the RLS fix migration that creates/updates **current_user_role()** is applied so policies on `notifications` work.
- Users only see notifications where **target_role** = their role; refetch queries with `.eq('target_role', currentUserRole)`.

### Manual real-time tests (before release)

1. **Notifications**
   - Log in as e.g. Head Supervisor on Device A.
   - In Supabase SQL Editor (or another user/device):  
     `INSERT INTO public.notifications (id, target_role, title, body, created_at, read) VALUES (gen_random_uuid()::text, 'head_supervisor', 'Test', 'Real-time test', now(), false);`
   - On Device A, without pulling to refresh, the bell badge should update and opening the notifications modal should show the new row.

2. **Vehicles**
   - On Device A, open Vehicles. On Device B (or SQL), add/update a vehicle. Device A’s list should update automatically (or after a short delay) without pull-to-refresh.

3. **Sites / Expenses / Trips**
   - Same idea: change data from another client or SQL; confirm the app’s list/screen updates without manual refresh.

If any of these fail, check (1) Replication includes that table, (2) RLS allows the current user to SELECT that table, (3) no firewall/proxy blocking WebSocket (Supabase Realtime).

---

## 2. Build and version (Play Store)

| Item | Location | Current / Action |
|------|----------|------------------|
| **version** | app.json → expo.version | 1.0.0 ✓ |
| **versionCode** (Android) | app.json → expo.android.versionCode | 1 ✓ |
| **package** | app.json → expo.android.package | com.hapyjo.attendance ✓ |
| **AAB for store** | eas.json → production uses app-bundle | ✓ |

For **first release** these are fine. For **future updates**, bump `version` (e.g. 1.0.1) and `versionCode` (e.g. 2) before building.

---

## 3. Environment variables (EAS production build)

Production build must have:

- **EXPO_PUBLIC_SUPABASE_URL** – your Supabase project URL.
- **EXPO_PUBLIC_SUPABASE_ANON_KEY** – anon key for the same project.

Set them in EAS:

- **eas.json** (production profile) does not need changes.
- In **EAS dashboard** (or CLI): Project → Secrets → add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` so the production build uses your live DB.

Optional (for GPS static map):

- **EXPO_PUBLIC_GOOGLE_MAPS_API_KEY** – only if you use the static map feature; app works without it.

---

## 4. Database (Supabase) before release

- [ ] All migrations applied (especially notifications, realtime, RLS, vehicle sync, current_user_role).
- [ ] Replication includes all 15 tables above (including **notifications**).
- [ ] `public.current_user_role()` exists and returns the correct role for the authenticated user (used by notifications and other RLS).
- [ ] No test/dummy data left in critical tables unless intended (e.g. notifications dummy data is optional; remove or keep by design).

---

## 5. Pre-release manual test list

- [ ] **Login** – Email + password, correct redirect after auth.
- [ ] **Roles** – At least one login per role (admin, owner, head_supervisor, assistant_supervisor, driver_truck, driver_machine, accountant, surveyor) and confirm tabs/screens match RBAC (e.g. drivers don’t see Reports/Users/Vehicles).
- [ ] **Notifications** – Bell icon, badge count, open modal, list and “mark read” / “clear all”. **Real-time:** insert a notification from SQL for that role and confirm it appears without refresh.
- [ ] **Vehicles** – List, add (truck/machine), edit, free (no site), sync from website if used. Real-time: change from another client, confirm list updates.
- [ ] **Sites** – List, detail, vehicles per site.
- [ ] **Expenses** – Add general/fuel, linked to site/vehicle where applicable.
- [ ] **Trips / Machine sessions** – Start, complete, fuel deduction behaviour.
- [ ] **Reports** – Generate, view, export (for roles that can).
- [ ] **Surveys / Issues** – Create and view as allowed by role.
- [ ] **Driver allocation** – Head supervisor can assign drivers to vehicles/sites.
- [ ] **Settings** – Language (EN/Rn), logout, notifications toggle (in-app list).
- [ ] **Offline** – With bad/no network, app should not crash; queue or graceful errors (see PRODUCTION_READINESS_AUDIT.md for known offline limitations).

---

## 6. Known limitations (from audit)

- **RBAC:** Some RLS policies are permissive (e.g. “authenticated read all” on sites/vehicles/expenses). App hides tabs by role, but direct API access could see more. Acceptable for v1 if you rely on app-only access.
- **Offline:** Offline queue exists for expenses/trips; other mutations are not queued. Behaviour with no network is “best effort” and partial.
- **Realtime:** If the Realtime WebSocket disconnects (e.g. long sleep, network switch), the app may not refetch until the next user action (e.g. open screen, pull-to-refresh). Consider adding a reconnection/refetch on app focus if you need guaranteed freshness.

---

## 7. Build and upload (reminder)

```bash
# Production AAB (for Play Store)
eas build --platform android --profile production

# After build succeeds, submit (or upload AAB manually)
eas submit --platform android --profile production --latest
```

Ensure EAS project is linked and secrets are set before building.

---

## 8. Summary

| Area | Status | Action |
|------|--------|--------|
| Real-time (all 15 tables) | Subscribed in app; refetch on change | Confirm Replication includes all tables (especially **notifications**) |
| Notifications real-time | Refetch loads by target_role; RLS uses current_user_role() | Test: insert notification in DB → appears in app without refresh |
| Version / package | 1.0.0, versionCode 1, com.hapyjo.attendance | OK for first release |
| Env (production) | EXPO_PUBLIC_SUPABASE_* required | Set in EAS Secrets for production build |
| DB migrations & RLS | current_user_role, notifications, realtime | Apply all; verify Replication and RLS |
| Manual tests | Login, roles, notifications, vehicles, sites, expenses, trips, reports | Run through list above |

Once the above is done, real-time (including notifications) and release readiness are covered for tomorrow’s Play Store release.
