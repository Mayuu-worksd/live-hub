import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

function isAdmin(req: NextRequest) {
  const role = req.cookies.get('livehub_role')?.value;
  return role === 'admin' || role === 'super_admin';
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const { id } = await params;
  const { action } = await req.json(); // 'approve' | 'reject'

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action. Must be approve or reject.' }, { status: 400 });
  }

  const status = action === 'approve' ? 'approved' : 'rejected';

  const { data, error } = await supabaseAdmin
    .from('withdrawals')
    .update({ status, processed_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, user:users!user_id(username, email)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
