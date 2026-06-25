require('dotenv').config({ path: 'apps/backoffice/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id, username, email, role, is_verified, is_banned, created_at,
      profile:profiles(display_name, avatar_url, followers_count, total_earned),
      wallet:wallets(coin_balance, diamond_balance, total_earned)
    `)
    .in('role', ['creator', 'verified_creator']);

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('DATA:', JSON.stringify(data, null, 2));
  }
}
main();
