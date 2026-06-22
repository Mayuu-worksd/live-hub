import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

function isAdmin(req: NextRequest) {
  const role = req.cookies.get('livehub_role')?.value;
  return role === 'admin' || role === 'super_admin';
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from('gift_catalog')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const { id } = await params;

  const { error } = await supabaseAdmin.from('gift_catalog').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
