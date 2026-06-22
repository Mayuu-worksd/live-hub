import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJh...';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: user } = await supabase.from('users').select('*').eq('username', 'mavericksteam2255').single();
  console.log('User:', user?.id, user?.username);
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    console.log('Profile:', profile);
  }
}
check();
