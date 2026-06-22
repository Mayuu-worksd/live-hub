import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

async function getUser(req: NextRequest) {
  const session = req.cookies.get('livehub_session')?.value;
  if (!session) return null;
  try {
    const [, payloadB64] = session.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('firebase_uid', payload.sub).single();
    return user;
  } catch (err) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const { data: blocks } = await supabaseAdmin
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);
      
    return NextResponse.json({ blocks: blocks?.map(b => b.blocked_id) || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const { blockedId } = await req.json();
    if (!blockedId) return NextResponse.json({ error: 'Missing blockedId' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('user_blocks')
      .insert({ blocker_id: user.id, blocked_id: blockedId });
      
    if (error && error.code !== '23505') throw error; // Ignore unique violation

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const blockedId = req.nextUrl.searchParams.get('blockedId');
  if (!blockedId) return NextResponse.json({ error: 'Missing blockedId' }, { status: 400 });

  try {
    const { error } = await supabaseAdmin
      .from('user_blocks')
      .delete()
      .match({ blocker_id: user.id, blocked_id: blockedId });
      
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
