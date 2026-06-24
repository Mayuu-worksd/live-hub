import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ProfileView } from './ProfileView';

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  // 1. Fetch User ID from Username
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, role, is_verified, created_at, username')
    .ilike('username', username)
    .single();

  if (!user) return notFound();

  // 2. Fetch Profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return notFound();

  // 3. Fetch Recent Streams (VODs or Past Streams)
  const { data: streams } = await supabaseAdmin
    .from('streams')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6);

  return <ProfileView initialUser={user} initialProfile={profile} streams={streams || []} />;
}
