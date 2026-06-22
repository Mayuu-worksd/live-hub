import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const stream_id = req.nextUrl.searchParams.get('stream_id');
  if (!stream_id) return NextResponse.json({ error: 'Missing stream_id' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('stream_messages')
    .select('*, user:users!user_id(id, username, profile:profiles(display_name, avatar_url))')
    .eq('stream_id', stream_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: (data ?? []).reverse() });
}

export async function POST(req: NextRequest) {
  const session = req.cookies.get('livehub_session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const [, payloadB64] = session.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    const uid = payload.sub;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', uid)
      .single();

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { stream_id, content } = await req.json();
    if (!stream_id || !content?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('stream_messages').insert({
      stream_id,
      user_id: user.id,
      content: content.trim(),
      type: 'text',
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
