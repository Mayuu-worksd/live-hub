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

  let query = supabaseAdmin
    .from('users')
    .select('id, firebase_uid, email, username, role, platform, is_verified, is_banned, onboarding_completed, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (search) {
    query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
