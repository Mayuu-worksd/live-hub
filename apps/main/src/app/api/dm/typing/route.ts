import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const session = req.cookies.get('livehub_session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const [, payloadB64] = session.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('firebase_uid', payload.sub).single();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const { conversationId, isTyping } = await req.json();

    if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });

    // Verify user is part of the conversation
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
      .single();

    if (!conv) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    // Send realtime broadcast
    const channel = supabaseAdmin.channel(`chat:${conversationId}`);
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, isTyping }
    });
    // Remove channel instance so it doesn't leak
    supabaseAdmin.removeChannel(channel);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
