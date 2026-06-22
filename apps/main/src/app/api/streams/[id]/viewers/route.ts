import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

async function getAuthenticatedUser(req: NextRequest) {
  const session = req.cookies.get('livehub_session')?.value;
  if (!session) return null;
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
    const [, payloadB64] = session.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    if (payload.aud !== projectId) return null;

    const uid = payload.sub;
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role, username')
      .eq('firebase_uid', uid)
      .single();

    return user;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: streamId } = await params;
    const { action } = await req.json();
    const authUser = await getAuthenticatedUser(req);

    const { data: stream } = await supabaseAdmin
      .from('streams')
      .select('viewer_count, peak_viewers')
      .eq('id', streamId)
      .single();

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (action === 'join') {
      // 1. Increment stream viewer count
      const newViewerCount = (stream.viewer_count || 0) + 1;
      const newPeakViewers = Math.max(stream.peak_viewers || 0, newViewerCount);
      
      await supabaseAdmin
        .from('streams')
        .update({ 
          viewer_count: newViewerCount,
          peak_viewers: newPeakViewers
        })
        .eq('id', streamId);

      // 2. Track viewer session if authenticated
      if (authUser) {
        // Insert a new viewer session
        await supabaseAdmin
          .from('stream_viewers')
          .insert({
            stream_id: streamId,
            user_id: authUser.id,
            joined_at: new Date().toISOString()
          });

        // 3. Post system message: User joined
        await supabaseAdmin.from('stream_messages').insert({
          stream_id: streamId,
          user_id: authUser.id,
          content: `${authUser.username} joined the stream`,
          type: 'system'
        });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === 'leave') {
      // 1. Decrement stream viewer count
      const newViewerCount = Math.max(0, (stream.viewer_count || 0) - 1);
      
      await supabaseAdmin
        .from('streams')
        .update({ viewer_count: newViewerCount })
        .eq('id', streamId);

      // 2. Update tracking if authenticated
      if (authUser) {
        // Find their active join session (most recent without a leave time)
        const { data: session } = await supabaseAdmin
          .from('stream_viewers')
          .select('id, joined_at')
          .eq('stream_id', streamId)
          .eq('user_id', authUser.id)
          .is('leaved_at', null)
          .order('joined_at', { ascending: false })
          .limit(1)
          .single();

        if (session) {
          const leavedAt = new Date();
          const joinedAt = new Date(session.joined_at);
          const durationSeconds = Math.max(0, Math.floor((leavedAt.getTime() - joinedAt.getTime()) / 1000));

          await supabaseAdmin
            .from('stream_viewers')
            .update({
              leaved_at: leavedAt.toISOString(),
              watch_duration_seconds: durationSeconds
            })
            .eq('id', session.id);
        }

        // 3. Post system message: User left
        await supabaseAdmin.from('stream_messages').insert({
          stream_id: streamId,
          user_id: authUser.id,
          content: `${authUser.username} left the stream`,
          type: 'system'
        });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
