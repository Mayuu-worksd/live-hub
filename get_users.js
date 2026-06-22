require('dotenv').config({ path: 'apps/main/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: users, error } = await supabase.from('users').select('email, role, username');
  if (error) {
    console.error(error);
  } else {
    console.log('--- USERS IN DATABASE ---');
    users.forEach(u => console.log(`${u.email} | Role: ${u.role} | Username: ${u.username}`));
  }
}
main();
