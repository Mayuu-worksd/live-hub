import { NextRequest, NextResponse } from 'next/server';
import { generateLiveKitToken } from '@/lib/livekit/token';
import { supabaseAdmin } from '@/lib/supabase/server';

// Helper to authenticate user from cookies
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

export async function POST(req: NextRequest) {
  try {
    const { streamId, roomName, userId, role } = await req.json();
    const authUser = await getAuthenticatedUser(req);

    // Enforce Token Security rules
    const isRequestingPublish = role === 'host';

    let targetRoomName = '';
    let targetParticipantIdentity = '';
    let canPublish = false;

    if (streamId) {
      // 1. Fetch stream details
      const { data: stream } = await supabaseAdmin
        .from('streams')
        .select('livekit_room_name, host_id, status')
        .eq('id', streamId)
        .single();

      if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
      if (stream.status === 'ended') return NextResponse.json({ error: 'Stream ended' }, { status: 410 });

      targetRoomName = stream.livekit_room_name;
      const isOwner = authUser && stream.host_id === authUser.id;

      if (isRequestingPublish) {
        // Only stream owner or verified co-hosts may request host/publish tokens
        if (isOwner) {
          canPublish = true;
          targetParticipantIdentity = authUser.id;
        } else {
          // Check co-host status
          if (authUser) {
            const { data: cohostReq } = await supabaseAdmin
              .from('cohost_requests')
              .select('status')
              .eq('stream_id', streamId)
              .eq('user_id', authUser.id)
              .eq('status', 'accepted')
              .single();

            if (cohostReq) {
              canPublish = true;
              targetParticipantIdentity = authUser.id;
            } else {
              return NextResponse.json({ error: 'Unauthorized to publish on this stream' }, { status: 403 });
            }
          } else {
            return NextResponse.json({ error: 'Authentication required to publish' }, { status: 401 });
          }
        }
      } else {
        // Viewer role
        if (authUser) {
          // Enforce matched identity to prevent token spoofing
          if (userId && userId !== authUser.id) {
            return NextResponse.json({ error: 'Participant identity mismatch' }, { status: 403 });
          }
          targetParticipantIdentity = authUser.id;
        } else {
          // Anonymous user -> Viewer permissions only, safe random identity
          targetParticipantIdentity = `anon_${Math.random().toString(36).substring(2, 11)}`;
        }
        canPublish = false;
      }
    } else if (roomName) {
      // 2. Fetch call details
      if (roomName.startsWith('call_')) {
        const { data: callSession } = await supabaseAdmin
          .from('call_sessions')
          .select('caller_id, callee_id, status')
          .eq('livekit_room_name', roomName)
          .single();

        if (!callSession) return NextResponse.json({ error: 'Call session not found' }, { status: 404 });
        if (callSession.status !== 'active') return NextResponse.json({ error: 'Call session is not active' }, { status: 400 });

        if (!authUser) return NextResponse.json({ error: 'Authentication required for calls' }, { status: 401 });
        if (callSession.caller_id !== authUser.id && callSession.callee_id !== authUser.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Match caller/callee ID to avoid spoofing
        if (userId && userId !== authUser.id) {
          return NextResponse.json({ error: 'Participant identity mismatch' }, { status: 403 });
        }

        targetRoomName = roomName;
        targetParticipantIdentity = authUser.id;
        canPublish = true; // Both publish in a call
      } else {
        return NextResponse.json({ error: 'Invalid roomName format' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Missing streamId or roomName' }, { status: 400 });
    }

    const token = await generateLiveKitToken(
      targetRoomName,
      targetParticipantIdentity,
      canPublish
    );

    return NextResponse.json({ token, roomName: targetRoomName, participantIdentity: targetParticipantIdentity });
  } catch (err) {
    console.error('[livekit/token]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
