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
    const { action, userId } = await req.json(); // userId of the target viewer (if action === 'invite')
    const authUser = await getAuthenticatedUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const { data: stream } = await supabaseAdmin
      .from('streams')
      .select('host_id, title')
      .eq('id', streamId)
      .single();

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (action === 'request') {
      // Viewer requests to co-host
      const { data: request, error } = await supabaseAdmin
        .from('cohost_requests')
        .insert({
          stream_id: streamId,
          user_id: authUser.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ request });
    }

    if (action === 'invite') {
      // Host invites a viewer
      if (stream.host_id !== authUser.id) {
        return NextResponse.json({ error: 'Only the host can invite co-hosts' }, { status: 403 });
      }

      if (!userId) {
        return NextResponse.json({ error: 'Missing userId to invite' }, { status: 400 });
      }

      const { data: request, error } = await supabaseAdmin
        .from('cohost_requests')
        .insert({
          stream_id: streamId,
          user_id: userId,
          status: 'invited'
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ request });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: streamId } = await params;
    const { action, userId } = await req.json(); // target co-host userId
    const authUser = await getAuthenticatedUser(req);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const { data: stream } = await supabaseAdmin
      .from('streams')
      .select('host_id, title')
      .eq('id', streamId)
      .single();

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    const isHost = stream.host_id === authUser.id;

    if (action === 'accept') {
      // If Host accepts viewer's request, or viewer accepts host's invitation
      let targetUserId = userId;
      if (!isHost) {
        // Viewer accepting an invitation
        targetUserId = authUser.id;
      }

      if (!targetUserId) {
        return NextResponse.json({ error: 'Missing target user ID' }, { status: 400 });
      }

      const { data: request, error } = await supabaseAdmin
        .from('cohost_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (error || !request) {
        return NextResponse.json({ error: error?.message || 'Request not found' }, { status: 400 });
      }

      // Fetch user info for chat system message
      const { data: targetUser } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('id', targetUserId)
        .single();

      // Post system message: Co-host joined
      await supabaseAdmin.from('stream_messages').insert({
        stream_id: streamId,
        user_id: targetUserId,
        content: `${targetUser?.username || 'User'} joined as co-host`,
        type: 'system'
      });

      return NextResponse.json({ request });
    }

    if (action === 'reject') {
      // Host rejects a co-host request
      if (!isHost) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { error } = await supabaseAdmin
        .from('cohost_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === 'remove') {
      // Host removes a co-host
      if (!isHost) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { error } = await supabaseAdmin
        .from('cohost_requests')
        .update({ status: 'removed', updated_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Fetch user info
      const { data: targetUser } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      // Post system message: Co-host removed
      await supabaseAdmin.from('stream_messages').insert({
        stream_id: streamId,
        user_id: userId,
        content: `${targetUser?.username || 'User'} left co-hosting`,
        type: 'system'
      });

      return NextResponse.json({ ok: true });
    }

    if (action === 'leave') {
      // Co-host leaves stream
      const { error } = await supabaseAdmin
        .from('cohost_requests')
        .update({ status: 'left', updated_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('user_id', authUser.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Post system message: Co-host left
      await supabaseAdmin.from('stream_messages').insert({
        stream_id: streamId,
        user_id: authUser.id,
        content: `${authUser.username || 'User'} left co-hosting`,
        type: 'system'
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
