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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id: otherUserId } = await params;

  try {
    // 1. Find conversation
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .or(`and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`)
      .single();

    if (!conv) {
      return NextResponse.json({ messages: [] });
    }

    // 2. Fetch messages
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ messages: (messages || []).reverse(), conversationId: conv.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id: conversationId } = await params;

  try {
    // Mark all unread messages sent by the OTHER person as read
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const messageId = req.nextUrl.searchParams.get('messageId');
  if (!messageId) return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });

  try {
    // Verify ownership
    const { data: msg } = await supabaseAdmin
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (!msg || msg.sender_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), content: 'This message was deleted' })
      .eq('id', messageId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
