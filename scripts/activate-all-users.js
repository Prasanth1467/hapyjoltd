/**
 * Set all users (profiles) to active in Supabase.
 * Run: node scripts/activate-all-users.js
 * Requires .env: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

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
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data: profiles, error: selectError } = await supabase
    .from('profiles')
    .select('id, email, name, active');

  if (selectError) {
    console.error('Failed to fetch profiles:', selectError.message);
    process.exit(1);
  }

  const list = profiles || [];
  if (list.length === 0) {
    console.log('No profiles found.');
    return;
  }

  const ids = list.map((p) => p.id);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ active: true })
    .in('id', ids);

  if (updateError) {
    console.error('Failed to activate users:', updateError.message);
    process.exit(1);
  }

  const inactive = list.filter((p) => p.active === false || p.active == null);
  console.log('All', list.length, 'users are now active.' + (inactive.length > 0 ? ' Previously inactive: ' + inactive.map((p) => p.email || p.id).join(', ') : ''));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
