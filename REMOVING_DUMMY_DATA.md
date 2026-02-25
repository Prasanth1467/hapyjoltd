# Removing dummy / demo data

The script `scripts/seed-dummy-rwanda.js` inserts demo data for client presentation. All demo entities use IDs prefixed with `demo-`.

## How to remove demo data later

Run the following in the Supabase SQL editor (or via a small script) **after** you no longer need the demo data. Order matters because of foreign keys.

1. **Delete in dependency order** (child tables first):

```sql
-- Notifications (if any demo link)
DELETE FROM public.notifications WHERE link_id LIKE 'demo-%';

-- Expenses
DELETE FROM public.expenses WHERE id LIKE 'demo-%';

-- Trips, machine_sessions (if any reference demo vehicles)
DELETE FROM public.trips WHERE vehicle_id LIKE 'demo-%';
DELETE FROM public.machine_sessions WHERE vehicle_id LIKE 'demo-%';

-- Reports
DELETE FROM public.reports WHERE id LIKE 'demo-%';

-- Vehicles
DELETE FROM public.vehicles WHERE id LIKE 'demo-%';

-- Sites
DELETE FROM public.sites WHERE id LIKE 'demo-%';
```

2. Alternatively, run `seed-dummy-rwanda.js` only when you need a full demo; for production handover, run the deletes above once.

## Re-seeding

You can run `node scripts/seed-dummy-rwanda.js` again; it uses upsert so existing demo rows are updated.
