require('dotenv').config({ path: 'apps/main/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: calls, error } = await supabase
    .from('call_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching calls:', error);
  } else {
    console.log('--- LATEST 5 CALL SESSIONS ---');
    console.log(JSON.stringify(calls, null, 2));
  }
}
main();
