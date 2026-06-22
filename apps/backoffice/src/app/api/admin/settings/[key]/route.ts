import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

function isAdmin(req: NextRequest) {
  const role = req.cookies.get('livehub_role')?.value;
  return role === 'admin' || role === 'super_admin';
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const { key } = await params;
  const body = await req.json();
  const { value } = body;

  if (value === undefined) return NextResponse.json({ error: 'Missing value' }, { status: 400 });

  // Upsert: update existing or insert new
  const { data: existing } = await supabaseAdmin
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', key)
    .single();

  if (!existing) return NextResponse.json({ error: 'Setting not found' }, { status: 404 });

  const newValue = { ...existing.setting_value, value };

  const { data, error } = await supabaseAdmin
    .from('admin_settings')
    .update({ setting_value: newValue, updated_at: new Date().toISOString() })
    .eq('setting_key', key)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
