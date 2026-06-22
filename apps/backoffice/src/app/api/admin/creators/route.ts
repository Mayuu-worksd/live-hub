import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

function isAdmin(req: NextRequest) {
  const role = req.cookies.get('livehub_role')?.value;
  return role === 'admin' || role === 'super_admin';
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const url = new URL(req.url);
  const search = url.searchParams.get('q') ?? '';
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  // Fetch users with creator/verified_creator role
  let query = supabaseAdmin
    .from('users')
    .select(`
      id, username, email, role, is_verified, is_banned, created_at,
      profile:profiles(display_name, avatar_url, followers_count, total_earned),
      wallet:wallets(coin_balance, diamond_balance, total_earned)
    `)
    .in('role', ['creator', 'verified_creator'])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count });
}
