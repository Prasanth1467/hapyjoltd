/**
 * Full Rwanda demo seed: real Auth users (all roles) + interlinked operational data.
 * Run: node scripts/seed-dummy-rwanda.js
 * Requires .env: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * 1) Creates or updates 8 real Supabase Auth users (admin, owner, head_supervisor, accountant,
 *    assistant_supervisor, surveyor, driver_truck, driver_machine) with Rwanda-style names.
 * 2) Seeds sites, vehicles, site_assignments, driver_vehicle_assignments, expenses, trips,
 *    machine_sessions, surveys, issues, tasks, operations, reports (financial + operations + site_performance),
 *    notifications (one per role), and minimal data for Rubavu/Musanze/Gisenyi so every site has some records.
 * So Admin (or any role) sees real other users and their data across the app; no redundancy.
 *
 * Demo entity IDs use prefix "demo-" for later cleanup (see REMOVING_DUMMY_DATA.md).
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const m = line.match(/^\s*([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
  }
}

loadEnv();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const DEMO_PREFIX = 'demo-';

// Real users: same emails as sync-production-users.js; Rwanda-style display names. All will exist in Auth + profiles.
const REAL_USERS = [
  { email: 'admin@hapyjo.com', password: 'Admin@123', role: 'admin', name: 'Jean Claude Admin' },
  { email: 'owner@hapyjo.com', password: 'HpY!Ow9#R4vT2K', role: 'owner', name: 'Jean Paul Uwimana' },
  { email: 'accountant@hapyjo.com', password: 'Hj$Ac7@L5pQ9X', role: 'accountant', name: 'Marie Mukandori' },
  { email: 'headsupervisor@hapyjo.com', password: 'Hs#Hd8!V3mW6P', role: 'head_supervisor', name: 'Patrick Habimana' },
  { email: 'asstsupervisor@hapyjo.com', password: 'Ha!As5#T7pL2Z', role: 'assistant_supervisor', name: 'Eric Niyonzima' },
  { email: 'surveyor@hapyjo.com', password: 'Hy$Sv4@Q9kN1M', role: 'surveyor', name: 'Claudine Uwera' },
  { email: 'drivertruck@hapyjo.com', password: 'Ht!Dt6#X2bC8F', role: 'driver_truck', name: 'Emmanuel Nsengimana' },
  { email: 'drivermachine@hapyjo.com', password: 'Hm@Dm3!P9sR5Y', role: 'driver_machine', name: 'David Murekezi' },
];

const rwandaSites = [
  { id: `${DEMO_PREFIX}site-kigali`, name: 'Kigali City Road', location: 'Kigali, Gasabo', budget: 25000000, spent: 8200000 },
  { id: `${DEMO_PREFIX}site-rubavu`, name: 'Rubavu District', location: 'Rubavu, Western Province', budget: 18000000, spent: 5100000 },
  { id: `${DEMO_PREFIX}site-musanze`, name: 'Musanze Highway', location: 'Musanze, Northern Province', budget: 22000000, spent: 6300000 },
  { id: `${DEMO_PREFIX}site-gisenyi`, name: 'Gisenyi Urban', location: 'Gisenyi, Western Province', budget: 12000000, spent: 2900000 },
];

const vehiclesForSites = [
  { siteId: `${DEMO_PREFIX}site-kigali`, vehicles: [
    { id: `${DEMO_PREFIX}v-kig-1`, type: 'truck', number: 'RWA-KGL-001', mileage: 5.2, tank: 200 },
    { id: `${DEMO_PREFIX}v-kig-2`, type: 'machine', number: 'EXC-KGL-01', hoursPerL: 0.8, tank: 80 },
  ]},
  { siteId: `${DEMO_PREFIX}site-rubavu`, vehicles: [
    { id: `${DEMO_PREFIX}v-rub-1`, type: 'truck', number: 'RWA-RUB-001', mileage: 4.8, tank: 180 },
  ]},
  { siteId: `${DEMO_PREFIX}site-musanze`, vehicles: [
    { id: `${DEMO_PREFIX}v-mus-1`, type: 'truck', number: 'RWA-MUS-001', mileage: 5.0, tank: 200 },
    { id: `${DEMO_PREFIX}v-mus-2`, type: 'machine', number: 'BLD-MUS-01', hoursPerL: 0.9, tank: 70 },
  ]},
];

async function ensureRealUsers() {
  const userIds = {};
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authUsers = listData?.users || [];

  for (const spec of REAL_USERS) {
    const emailLower = spec.email.toLowerCase();
    const existing = authUsers.find((u) => u.email && u.email.toLowerCase() === emailLower);

    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, { password: spec.password });
      await supabase.from('profiles').upsert(
        { id: existing.id, email: spec.email, name: spec.name, role: spec.role, active: true },
        { onConflict: 'id' }
      );
      userIds[spec.role] = existing.id;
      console.log('  OK (existing):', spec.email, '->', spec.role);
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: spec.email,
        password: spec.password,
        email_confirm: true,
        user_metadata: { role: spec.role, name: spec.name },
      });
      if (error) {
        console.error('  Create failed:', spec.email, error.message);
        continue;
      }
      const uid = created.user?.id;
      if (uid) {
        await supabase.from('profiles').upsert(
          { id: uid, email: spec.email, name: spec.name, role: spec.role, active: true },
          { onConflict: 'id' }
        );
        userIds[spec.role] = uid;
        console.log('  Created:', spec.email, '->', spec.role);
      }
    }
  }

  return userIds;
}

function iso(date) {
  return date.toISOString().slice(0, 10);
}
function isoFull(d) {
  return d.toISOString();
}

async function main() {
  const today = new Date();
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const todayStr = iso(today);
  const startDateStr = iso(startDate);

  console.log('Step 1: Ensure real Auth users (all roles)...');
  const userIds = await ensureRealUsers();
  const asstId = userIds.assistant_supervisor;
  const surveyorId = userIds.surveyor;
  const driverTruckId = userIds.driver_truck;
  const driverMachineId = userIds.driver_machine;

  if (!asstId || !surveyorId || !driverTruckId || !driverMachineId) {
    console.error('Missing required user IDs. Ensure all 8 users were created.');
    process.exit(1);
  }

  console.log('\nStep 2: Seed Rwanda sites (with assistant_supervisor, surveyor, driver links)...');
  const siteKigaliId = rwandaSites[0].id;
  for (const site of rwandaSites) {
    const row = {
      id: site.id,
      name: site.name,
      location: site.location,
      status: 'active',
      start_date: startDateStr,
      budget: site.budget,
      spent: site.spent,
      progress: Math.floor(Math.random() * 40) + 20,
      contract_rate_rwf: 500,
      assistant_supervisor_id: site.id === siteKigaliId ? asstId : null,
      surveyor_id: site.id === siteKigaliId ? surveyorId : null,
      driver_ids: site.id === siteKigaliId ? [driverTruckId, driverMachineId] : [],
      vehicle_ids: [],
    };
    const { error } = await supabase.from('sites').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Site', site.id, error.message);
    else console.log('  ', site.name);
  }

  console.log('\nStep 3: Seed vehicles...');
  const vehicleIdsBySite = {};
  for (const { siteId, vehicles } of vehiclesForSites) {
    vehicleIdsBySite[siteId] = [];
    for (const v of vehicles) {
      const row = {
        id: v.id,
        site_id: siteId,
        type: v.type,
        vehicle_number_or_id: v.number,
        tank_capacity_litre: v.tank,
        fuel_balance_litre: Math.floor(v.tank * 0.6),
        mileage_km_per_litre: v.mileage || null,
        hours_per_litre: v.hoursPerL || null,
      };
      const { error } = await supabase.from('vehicles').upsert(row, { onConflict: 'id' });
      if (error) console.error('  Vehicle', v.id, error.message);
      else {
        vehicleIdsBySite[siteId].push(v.id);
        console.log('  ', v.number, v.type);
      }
    }
  }

  // Update sites.vehicle_ids
  for (const site of rwandaSites) {
    const vids = vehicleIdsBySite[site.id] || [];
    if (vids.length) {
      await supabase.from('sites').update({ vehicle_ids: vids }).eq('id', site.id);
    }
  }

  console.log('\nStep 4: Seed site_assignments (so each role sees correct sites)...');
  const assignments = [
    { site_id: siteKigaliId, user_id: asstId, role: 'assistant_supervisor' },
    { site_id: siteKigaliId, user_id: surveyorId, role: 'surveyor' },
    { site_id: siteKigaliId, user_id: driverTruckId, role: 'driver_truck' },
    { site_id: siteKigaliId, user_id: driverMachineId, role: 'driver_machine' },
    { site_id: rwandaSites[1].id, user_id: asstId, role: 'assistant_supervisor' },
    { site_id: rwandaSites[1].id, user_id: driverTruckId, role: 'driver_truck' },
  ];
  for (const a of assignments) {
    const { error } = await supabase.from('site_assignments').upsert(
      { site_id: a.site_id, user_id: a.user_id, role: a.role, vehicle_ids: [] },
      { onConflict: 'site_id,user_id' }
    );
    if (error) console.error('  site_assignment', a.site_id, a.role, error.message);
  }
  console.log('  site_assignments done');

  console.log('\nStep 5: Seed driver_vehicle_assignments...');
  const truckVid = `${DEMO_PREFIX}v-kig-1`;
  const machineVid = `${DEMO_PREFIX}v-kig-2`;
  const dva = [
    { site_id: siteKigaliId, driver_id: driverTruckId, vehicle_ids: [truckVid] },
    { site_id: siteKigaliId, driver_id: driverMachineId, vehicle_ids: [machineVid] },
  ];
  for (const a of dva) {
    const { error } = await supabase.from('driver_vehicle_assignments').upsert(a, { onConflict: 'site_id,driver_id' });
    if (error) console.error('  driver_vehicle', error.message);
  }
  console.log('  driver_vehicle_assignments done');

  console.log('\nStep 6: Seed expenses...');
  const expenseRows = [
    { id: `${DEMO_PREFIX}e-1`, site_id: siteKigaliId, amount_rwf: 450000, description: 'Labour – Kigali crew', date: todayStr, type: 'general' },
    { id: `${DEMO_PREFIX}e-2`, site_id: siteKigaliId, amount_rwf: 96000, description: 'Fuel – RWA-KGL-001', date: todayStr, type: 'fuel', vehicle_id: truckVid, litres: 80, cost_per_litre: 1200, fuel_cost: 96000 },
    { id: `${DEMO_PREFIX}e-3`, site_id: rwandaSites[1].id, amount_rwf: 280000, description: 'Materials – Rubavu', date: todayStr, type: 'general' },
  ];
  for (const row of expenseRows) {
    const { error } = await supabase.from('expenses').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Expense', row.id, error.message);
  }
  console.log('  expenses done');

  console.log('\nStep 7: Seed trips (completed, driver_truck)...');
  const tripStart = new Date(today.getTime() - 4 * 60 * 60 * 1000);
  const tripEnd = new Date(today.getTime() - 2 * 60 * 60 * 1000);
  // Completed trips require start/end GPS and distance_km > 0 (trips_completed_gps_check)
  const trips = [
    {
      id: `${DEMO_PREFIX}t-1`,
      vehicle_id: truckVid,
      driver_id: driverTruckId,
      site_id: siteKigaliId,
      start_time: isoFull(tripStart),
      end_time: isoFull(tripEnd),
      start_lat: -1.9536,
      start_lon: 30.0606,
      end_lat: -1.9622,
      end_lon: 30.0690,
      distance_km: 42.5,
      status: 'completed',
      fuel_consumed: 8.2,
      created_at: isoFull(tripStart),
    },
    {
      id: `${DEMO_PREFIX}t-2`,
      vehicle_id: `${DEMO_PREFIX}v-rub-1`,
      driver_id: driverTruckId,
      site_id: rwandaSites[1].id,
      start_time: isoFull(new Date(today.getTime() - 6 * 60 * 60 * 1000)),
      end_time: isoFull(new Date(today.getTime() - 5 * 60 * 60 * 1000)),
      start_lat: -1.6967,
      start_lon: 29.3833,
      end_lat: -1.7010,
      end_lon: 29.3900,
      distance_km: 18,
      status: 'completed',
      fuel_consumed: 3.75,
      created_at: isoFull(today),
    },
  ];
  for (const row of trips) {
    const { error } = await supabase.from('trips').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Trip', row.id, error.message);
  }
  console.log('  trips done');

  console.log('\nStep 8: Seed machine_sessions (completed, driver_machine)...');
  const msStart = new Date(today.getTime() - 5 * 60 * 60 * 1000);
  const msEnd = new Date(today.getTime() - 3 * 60 * 60 * 1000);
  const machineSessions = [
    {
      id: `${DEMO_PREFIX}ms-1`,
      vehicle_id: machineVid,
      driver_id: driverMachineId,
      site_id: siteKigaliId,
      start_time: isoFull(msStart),
      end_time: isoFull(msEnd),
      duration_hours: 2,
      fuel_consumed: 2.5,
      status: 'completed',
      created_at: isoFull(msStart),
    },
  ];
  for (const row of machineSessions) {
    const { error } = await supabase.from('machine_sessions').upsert(row, { onConflict: 'id' });
    if (error) console.error('  MachineSession', row.id, error.message);
  }
  console.log('  machine_sessions done');

  console.log('\nStep 9: Seed surveys (surveyor)...');
  const surveys = [
    {
      id: `${DEMO_PREFIX}sur-1`,
      type: 'volume',
      site_id: siteKigaliId,
      site_name: rwandaSites[0].name,
      surveyor_id: surveyorId,
      status: 'approved',
      work_volume: 125.5,
      approved_by_id: asstId,
      approved_at: isoFull(new Date(today.getTime() - 24 * 60 * 60 * 1000)),
      created_at: isoFull(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)),
    },
    {
      id: `${DEMO_PREFIX}sur-2`,
      type: 'volume',
      site_id: siteKigaliId,
      site_name: rwandaSites[0].name,
      surveyor_id: surveyorId,
      status: 'submitted',
      created_at: isoFull(today),
    },
  ];
  for (const row of surveys) {
    const { error } = await supabase.from('surveys').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Survey', row.id, error.message);
  }
  console.log('  surveys done');

  console.log('\nStep 10: Seed issues (raised by assistant_supervisor and driver)...');
  const issues = [
    { id: `${DEMO_PREFIX}iss-1`, site_id: siteKigaliId, site_name: rwandaSites[0].name, raised_by_id: asstId, description: 'Pothole on section B – needs repair before rain.', status: 'open', created_at: isoFull(new Date(today.getTime() - 48 * 60 * 60 * 1000)) },
    { id: `${DEMO_PREFIX}iss-2`, site_id: siteKigaliId, site_name: rwandaSites[0].name, raised_by_id: driverTruckId, description: 'RWA-KGL-001 brake check recommended.', status: 'acknowledged', created_at: isoFull(today) },
  ];
  for (const row of issues) {
    const { error } = await supabase.from('issues').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Issue', row.id, error.message);
  }
  console.log('  issues done');

  console.log('\nStep 11: Seed tasks (assigned to driver and assistant_supervisor)...');
  const dueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tasks = [
    { id: `${DEMO_PREFIX}task-1`, title: 'Deliver gravel to Section A', description: 'Load and deliver 3 trips to Kigali Section A.', site_id: siteKigaliId, site_name: rwandaSites[0].name, assigned_to: [driverTruckId], status: 'in_progress', priority: 'high', due_date: iso(dueDate), progress: 40, created_at: isoFull(today), updated_at: isoFull(today) },
    { id: `${DEMO_PREFIX}task-2`, title: 'Survey Section C', description: 'Complete volume survey for Section C.', site_id: siteKigaliId, site_name: rwandaSites[0].name, assigned_to: [surveyorId], status: 'pending', priority: 'medium', due_date: iso(dueDate), progress: 0, created_at: isoFull(today), updated_at: isoFull(today) },
  ];
  for (const row of tasks) {
    const { error } = await supabase.from('tasks').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Task', row.id, error.message);
  }
  console.log('  tasks done');

  console.log('\nStep 12: Seed operations...');
  const operations = [
    { id: `${DEMO_PREFIX}op-1`, name: 'Kigali Phase 1', site_id: siteKigaliId, site_name: rwandaSites[0].name, type: 'road', status: 'ongoing', budget: 12000000, spent: 4200000, start_date: startDateStr, end_date: null, crew: ['Eric Niyonzima', 'Emmanuel Nsengimana', 'David Murekezi'] },
  ];
  for (const row of operations) {
    const { error } = await supabase.from('operations').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Operation', row.id, error.message);
  }
  console.log('  operations done');

  console.log('\nStep 13 & 14: Seed reports (financial, operations, site_performance) – aligned with seeded tasks/sites...');
  const period = todayStr.slice(0, 7);
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevPeriod = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  // Seeded data: 4 sites, 5 tasks (1 in_progress, 4 pending, 0 completed)
  const opsData = { activeSites: 4, completedTasks: 0, pendingTasks: 4, inProgressTasks: 1, periodStart: startDateStr, periodEnd: todayStr, generatedAt: isoFull(today) };
  const sitesSummary = rwandaSites.map((s) => ({
    siteName: s.name,
    budget: s.budget,
    spent: s.spent,
    remaining: s.budget - s.spent,
    utilizationPct: s.budget > 0 ? Math.round((s.spent / s.budget) * 100) : 0,
  }));
  const totalBudget = rwandaSites.reduce((a, s) => a + s.budget, 0);
  const totalSpent = rwandaSites.reduce((a, s) => a + s.spent, 0);
  const reportRows = [
    {
      id: `${DEMO_PREFIX}r-1`,
      title: `Financial Report ${period}`,
      type: 'financial',
      generated_date: todayStr,
      period,
      data: {
        trips: 12,
        machine_hours: 48.5,
        fuel_cost: 1250000,
        expenses: 3200000,
        revenue: 8500000,
        profit: 5300000,
        totalBudget,
        totalSpent,
        remainingBudget: totalBudget - totalSpent,
        periodStart: `${period}-01`,
        periodEnd: todayStr,
        expenseCount: 5,
        sitesSummary,
        generatedAt: isoFull(today),
      },
    },
    {
      id: `${DEMO_PREFIX}r-1b`,
      title: `Financial Report ${prevPeriod}`,
      type: 'financial',
      generated_date: iso(prevMonth),
      period: prevPeriod,
      data: {
        trips: 8,
        machine_hours: 32,
        fuel_cost: 980000,
        expenses: 2100000,
        revenue: 5200000,
        profit: 3100000,
        totalBudget,
        totalSpent: totalSpent - 1800000,
        remainingBudget: totalBudget - (totalSpent - 1800000),
        periodStart: `${prevPeriod}-01`,
        periodEnd: iso(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0)),
        expenseCount: 3,
        sitesSummary: rwandaSites.map((s) => ({ siteName: s.name, budget: s.budget, spent: Math.max(0, s.spent - 400000), remaining: s.budget - Math.max(0, s.spent - 400000), utilizationPct: 0 })),
        generatedAt: isoFull(prevMonth),
      },
    },
    { id: `${DEMO_PREFIX}r-2`, title: `Operations Report ${period}`, type: 'operations', generated_date: todayStr, period, data: opsData },
    { id: `${DEMO_PREFIX}r-2b`, title: `Operations Report ${prevPeriod}`, type: 'operations', generated_date: iso(prevMonth), period: prevPeriod, data: { ...opsData, completedTasks: 2, pendingTasks: 5, inProgressTasks: 0 } },
    { id: `${DEMO_PREFIX}r-3`, title: `Site Performance ${period}`, type: 'site_performance', generated_date: todayStr, period, data: { activeSites: 4, sitesSummary, periodStart: startDateStr, periodEnd: todayStr, generatedAt: isoFull(today) } },
    { id: `${DEMO_PREFIX}r-3b`, title: `Site Performance ${prevPeriod}`, type: 'site_performance', generated_date: iso(prevMonth), period: prevPeriod, data: { activeSites: 4, sitesSummary, periodStart: `${prevPeriod}-01`, periodEnd: iso(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0)), generatedAt: isoFull(prevMonth) } },
  ];
  for (const row of reportRows) {
    const { error } = await supabase.from('reports').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Report', row.id, error.message);
  }
  console.log('  reports done (2 financial, 2 operations, 2 site_performance)');

  console.log('\nStep 15: Seed notifications (so each role sees at least one)...');
  const notifRows = [
    { id: `${DEMO_PREFIX}n-admin`, target_role: 'admin', title: 'Demo ready', body: 'Rwanda demo data loaded. Log in as any role to explore.', created_at: isoFull(today), read: false },
    { id: `${DEMO_PREFIX}n-owner`, target_role: 'owner', title: 'Monthly summary', body: 'Site budgets and expenses are up to date.', created_at: isoFull(today), read: false },
    { id: `${DEMO_PREFIX}n-head`, target_role: 'head_supervisor', title: 'Kigali progress', body: 'Kigali City Road at 33% – on track.', created_at: isoFull(today), read: false },
    { id: `${DEMO_PREFIX}n-accountant`, target_role: 'accountant', title: 'Financial report', body: 'February financial report available.', created_at: isoFull(today), read: false },
    { id: `${DEMO_PREFIX}n-asst`, target_role: 'assistant_supervisor', title: 'Task assigned', body: 'Deliver gravel to Section A – in progress.', created_at: isoFull(today), read: false },
    { id: `${DEMO_PREFIX}n-surveyor`, target_role: 'surveyor', title: 'Survey Section C', body: 'Volume survey for Section C – pending.', created_at: isoFull(today), read: false },
    { id: `${DEMO_PREFIX}n-driver-t`, target_role: 'driver_truck', title: 'Trip completed', body: 'RWA-KGL-001 trip logged.', created_at: isoFull(today), read: false },
    { id: `${DEMO_PREFIX}n-driver-m`, target_role: 'driver_machine', title: 'Session completed', body: 'EXC-KGL-01 machine session recorded.', created_at: isoFull(today), read: false },
  ];
  for (const row of notifRows) {
    const { error } = await supabase.from('notifications').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Notification', row.id, error.message);
  }
  console.log('  notifications done');

  console.log('\nStep 16: Seed minimal data for Rubavu, Musanze, Gisenyi (no existing records)...');
  const rubavuId = rwandaSites[1].id;
  const musanzeId = rwandaSites[2].id;
  const gisenyiId = rwandaSites[3].id;
  const extraExpenses = [
    { id: `${DEMO_PREFIX}e-mus`, site_id: musanzeId, amount_rwf: 180000, description: 'Materials – Musanze Highway', date: todayStr, type: 'general' },
    { id: `${DEMO_PREFIX}e-gis`, site_id: gisenyiId, amount_rwf: 95000, description: 'Labour – Gisenyi Urban', date: todayStr, type: 'general' },
  ];
  for (const row of extraExpenses) {
    const { error } = await supabase.from('expenses').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Expense', row.id, error.message);
  }
  const extraIssues = [
    { id: `${DEMO_PREFIX}iss-rub`, site_id: rubavuId, site_name: rwandaSites[1].name, raised_by_id: asstId, description: 'Drainage check needed – Rubavu section.', status: 'open', created_at: isoFull(today) },
    { id: `${DEMO_PREFIX}iss-mus`, site_id: musanzeId, site_name: rwandaSites[2].name, raised_by_id: asstId, description: 'Material delivery delay – Musanze.', status: 'acknowledged', created_at: isoFull(today) },
    { id: `${DEMO_PREFIX}iss-gis`, site_id: gisenyiId, site_name: rwandaSites[3].name, raised_by_id: asstId, description: 'Equipment maintenance scheduled – Gisenyi.', status: 'open', created_at: isoFull(today) },
  ];
  for (const row of extraIssues) {
    const { error } = await supabase.from('issues').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Issue', row.id, error.message);
  }
  const extraOperations = [
    { id: `${DEMO_PREFIX}op-2`, name: 'Rubavu Phase 1', site_id: rubavuId, site_name: rwandaSites[1].name, type: 'road', status: 'ongoing', budget: 8000000, spent: 2100000, start_date: startDateStr, end_date: null, crew: ['Eric Niyonzima', 'Emmanuel Nsengimana'] },
    { id: `${DEMO_PREFIX}op-3`, name: 'Musanze North', site_id: musanzeId, site_name: rwandaSites[2].name, type: 'road', status: 'ongoing', budget: 10000000, spent: 3200000, start_date: startDateStr, end_date: null, crew: ['David Murekezi'] },
    { id: `${DEMO_PREFIX}op-4`, name: 'Gisenyi Urban', site_id: gisenyiId, site_name: rwandaSites[3].name, type: 'road', status: 'ongoing', budget: 6000000, spent: 900000, start_date: startDateStr, end_date: null, crew: [] },
  ];
  for (const row of extraOperations) {
    const { error } = await supabase.from('operations').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Operation', row.id, error.message);
  }
  const extraTasks = [
    { id: `${DEMO_PREFIX}task-rub`, title: 'Survey Rubavu section', description: 'Volume survey for Rubavu Phase 1.', site_id: rubavuId, site_name: rwandaSites[1].name, assigned_to: [surveyorId], status: 'pending', priority: 'medium', due_date: iso(dueDate), progress: 0, created_at: isoFull(today), updated_at: isoFull(today) },
    { id: `${DEMO_PREFIX}task-mus`, title: 'Excavation Musanze North', description: 'Complete excavation for Musanze North.', site_id: musanzeId, site_name: rwandaSites[2].name, assigned_to: [driverMachineId], status: 'pending', priority: 'high', due_date: iso(dueDate), progress: 0, created_at: isoFull(today), updated_at: isoFull(today) },
    { id: `${DEMO_PREFIX}task-gis`, title: 'Gisenyi site prep', description: 'Site preparation – Gisenyi Urban.', site_id: gisenyiId, site_name: rwandaSites[3].name, assigned_to: [asstId], status: 'pending', priority: 'low', due_date: iso(dueDate), progress: 0, created_at: isoFull(today), updated_at: isoFull(today) },
  ];
  for (const row of extraTasks) {
    const { error } = await supabase.from('tasks').upsert(row, { onConflict: 'id' });
    if (error) console.error('  Task', row.id, error.message);
  }
  console.log('  Rubavu, Musanze, Gisenyi minimal data done');

  console.log('\n========== DONE ==========');
  console.log('Real users (all roles) exist in Auth + profiles. Demo data is linked to them.');
  console.log('Log in as admin@hapyjo.com to see all users and interlinked sites, trips, surveys, issues, tasks.');
  console.log('Demo entity IDs use prefix "' + DEMO_PREFIX + '" for cleanup (see REMOVING_DUMMY_DATA.md).');
  console.log('\nLogin table (same as sync-production-users):');
  console.log('Email\t\t\t\t\tPassword\t\t\tRole');
  REAL_USERS.forEach((u) => console.log(`${u.email}\t\t${u.password}\t\t${u.role}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
