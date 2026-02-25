# Triggers and functions (Supabase)

Use this list to verify in **Database → Triggers** and **Database → Functions**. Realtime tables are in **Database → Replication** (publication `supabase_realtime`).

## Database triggers (public schema)

| Name | Table | Function | Events | Purpose |
|------|--------|----------|--------|---------|
| after_expense_insert | expenses | on_expense_insert | AFTER INSERT | Update sites.spent and vehicles.fuel_balance_litre |
| on_trip_status_completed | trips | on_trip_completed | BEFORE UPDATE | Set fuel_consumed, deduct vehicle fuel when status → completed |
| on_machine_session_status_completed | machine_sessions | on_machine_session_completed | BEFORE UPDATE | Set duration_hours/fuel_consumed, deduct vehicle fuel when status → completed |
| profiles_updated_at | profiles | set_updated_at | BEFORE UPDATE | Set profiles.updated_at |
| tasks_updated_at | tasks | set_updated_at | BEFORE UPDATE | Set tasks.updated_at |

**Auth (auth schema):** `on_auth_user_created` on `auth.users` → `handle_new_user` (creates profile on signup). Shown under Auth or Database depending on dashboard.

## Database functions (public schema)

| Name | Return type | Security | Purpose |
|------|-------------|----------|---------|
| current_user_role | app_role | Definer | Used by RLS policies; avoid text = app_role by casting to text where needed |
| get_my_profile | SETOF profiles | Definer | Current user's profile (avoids RLS issues on direct SELECT) |
| handle_new_user | trigger | Definer | Create profile from auth.users on signup |
| on_expense_insert | trigger | Definer | Backed by after_expense_insert trigger |
| on_machine_session_completed | trigger | Definer | Backed by on_machine_session_status_completed trigger |
| on_trip_completed | trigger | Definer | Backed by on_trip_status_completed trigger |
| prune_old_gps_photos | integer | Definer | Delete gps_photos older than 7 days (call from app or cron) |
| rls_auto_enable | event_trigger | Definer | Optional; auto-enable RLS on new tables if used |
| set_updated_at | trigger | Invoker | Used by profiles_updated_at and tasks_updated_at |

## Realtime (publication `supabase_realtime`)

All of these should be in the publication so the app’s `postgres_changes` subscriptions refetch correctly:

- sites, vehicles, expenses, trips, machine_sessions, surveys, issues  
- site_assignments, driver_vehicle_assignments, tasks, operations, reports  
- profiles, gps_photos, notifications  

Applied by migrations: `20250222120000_gps_photos_realtime.sql`, `20250223100000_notifications.sql`, `20250224100000_realtime_all_tables.sql`.
