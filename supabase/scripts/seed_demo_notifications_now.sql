-- =============================================================================
-- Demo notifications (current time)
-- Run in Supabase SQL Editor when you want to show sample notifications in the
-- app. Each insert uses now() so they appear as "just now". Run from time to
-- time to add fresh demo notifications. Each run adds new rows (new IDs).
-- =============================================================================

INSERT INTO public.notifications (id, target_role, title, body, created_at, read, link_id, link_type) VALUES
-- owner
(gen_random_uuid()::text, 'owner', 'New issue reported', '[Site Kigali] Vehicle needs maintenance. Driver reported at section 2.', now(), false, null, 'issue'),
(gen_random_uuid()::text, 'owner', 'Trip completed', '[Site North] T-01 • 32 km', now(), false, null, 'trip'),
(gen_random_uuid()::text, 'owner', 'Report ready', 'Financial Report (This month)', now(), false, null, 'report'),
-- head_supervisor
(gen_random_uuid()::text, 'head_supervisor', 'New issue reported', '[Site Kigali] Equipment breakdown. Need repair.', now(), false, null, 'issue'),
(gen_random_uuid()::text, 'head_supervisor', 'Survey submitted', '[Site North] – ready for review', now(), false, null, 'survey'),
(gen_random_uuid()::text, 'head_supervisor', 'New expense', '[Site Kigali] 85,000 RWF – Fuel refill', now(), false, null, 'expense'),
-- accountant
(gen_random_uuid()::text, 'accountant', 'Trip completed', '[Site North] T-02 • 28 km', now(), false, null, 'trip'),
(gen_random_uuid()::text, 'accountant', 'New expense', '[Site Kigali] 120,000 RWF – General supplies', now(), false, null, 'expense'),
(gen_random_uuid()::text, 'accountant', 'Report ready', 'Operations Report (This month)', now(), false, null, 'report'),
-- assistant_supervisor
(gen_random_uuid()::text, 'assistant_supervisor', 'New issue reported', '[Site North] Driver requested support.', now(), false, null, 'issue'),
(gen_random_uuid()::text, 'assistant_supervisor', 'Survey submitted', '[Site Kigali] – ready for review', now(), false, null, 'survey'),
(gen_random_uuid()::text, 'assistant_supervisor', 'Site assignment updated', 'Site North as assistant_supervisor', now(), false, null, 'site'),
-- surveyor
(gen_random_uuid()::text, 'surveyor', 'Survey approved', '[Site Kigali] has been approved', now(), false, null, 'survey'),
(gen_random_uuid()::text, 'surveyor', 'Survey approved', '[Site North] has been approved', now(), false, null, 'survey'),
-- driver_truck
(gen_random_uuid()::text, 'driver_truck', 'Vehicle assignment updated', '[Site Kigali] – 2 vehicle(s)', now(), false, null, 'site'),
(gen_random_uuid()::text, 'driver_truck', 'Trip completed', '[Site North] T-01 • 45 km', now(), false, null, 'trip'),
-- driver_machine
(gen_random_uuid()::text, 'driver_machine', 'Vehicle assignment updated', '[Site North] – 1 vehicle(s)', now(), false, null, 'site'),
(gen_random_uuid()::text, 'driver_machine', 'Machine session completed', '[Site Kigali] 3.5h', now(), false, null, 'machine_session'),
-- admin
(gen_random_uuid()::text, 'admin', 'New user added', 'Marie • driver_truck', now(), false, null, 'user'),
(gen_random_uuid()::text, 'admin', 'Report ready', 'Site Performance (This month)', now(), false, null, 'report');
