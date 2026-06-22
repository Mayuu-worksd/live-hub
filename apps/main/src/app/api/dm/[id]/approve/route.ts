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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id: conversationId } = await params;

  try {
    // Check if user is part of the conversation
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id, initiated_by, participant_one, participant_two')
      .eq('id', conversationId)
      .single();

    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (conv.participant_one !== user.id && conv.participant_two !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only the non-initiator can approve
    if (conv.initiated_by === user.id) {
      return NextResponse.json({ error: 'Cannot approve your own request' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ is_approved: true })
      .eq('id', conversationId);

    if (error) throw error;

    return NextResponse.json({ ok: true, is_approved: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
