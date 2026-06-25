import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const role = req.cookies.get('livehub_role')?.value;
  if (role !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, username, email, role, is_banned, created_at')
    .in('role', ['admin', 'super_admin', 'moderator', 'agency_manager'])
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
