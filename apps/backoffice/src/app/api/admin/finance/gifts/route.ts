import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

function isAdmin(req: NextRequest) {
  const role = req.cookies.get('livehub_role')?.value;
  return role === 'admin' || role === 'super_admin';
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('gift_catalog')
    .select('*')
    .order('coin_cost', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  const { name, emoji, coin_cost, category, animation_url, is_active } = body;

  if (!name || !coin_cost || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('gift_catalog')
    .insert({ name, emoji: emoji ?? '', coin_cost, category, animation_url: animation_url ?? null, is_active: is_active ?? true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
