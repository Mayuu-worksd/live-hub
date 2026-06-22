import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';
import { supabaseAdmin } from '@/lib/supabase/server';

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'No auth header' }, { status: 401 });
  }

  try {
    const rawBody = await req.text();
    const event = await receiver.receive(rawBody, authHeader);

    const roomName = event.room?.name || '';
    if (!roomName) {
      return NextResponse.json({ error: 'No room name in event' }, { status: 400 });
    }

    const eventName = event.event;

    // Handle Stream room events
    if (roomName.startsWith('stream_')) {
      // Find stream row by room name
      const { data: stream } = await supabaseAdmin
        .from('streams')
        .select('*')
        .eq('livekit_room_name', roomName)
        .single();

      if (!stream) {
        return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
      }

      if (eventName === 'room_started') {
        await supabaseAdmin
          .from('streams')
          .update({ status: 'live', started_at: new Date().toISOString() })
          .eq('id', stream.id);
      } 
      
      else if (eventName === 'room_finished') {
        await supabaseAdmin
          .from('streams')
          .update({ status: 'ended', ended_at: new Date().toISOString() })
          .eq('id', stream.id);
      } 
      
      else if (eventName === 'participant_joined') {
        const participantIdentity = event.participant?.identity || '';
        const isAnon = participantIdentity.startsWith('anon_');

        // Increment count in DB
        const newViewerCount = (stream.viewer_count || 0) + 1;
        const newPeakViewers = Math.max(stream.peak_viewers || 0, newViewerCount);
        await supabaseAdmin
          .from('streams')
          .update({ viewer_count: newViewerCount, peak_viewers: newPeakViewers })
          .eq('id', stream.id);

        if (!isAnon && participantIdentity) {
          // Verify user exists
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('username')
            .eq('id', participantIdentity)
            .single();

          if (user) {
            // Check if there is an active session (avoid duplicate entries)
            const { data: existingSession } = await supabaseAdmin
              .from('stream_viewers')
              .select('id')
              .eq('stream_id', stream.id)
              .eq('user_id', participantIdentity)
              .is('leaved_at', null)
              .limit(1)
              .single();

            if (!existingSession) {
              await supabaseAdmin.from('stream_viewers').insert({
                stream_id: stream.id,
                user_id: participantIdentity,
                joined_at: new Date().toISOString()
              });
            }

            // Check if it's a co-host or a standard user
            const { data: cohostReq } = await supabaseAdmin
              .from('cohost_requests')
              .select('status')
              .eq('stream_id', stream.id)
              .eq('user_id', participantIdentity)
              .eq('status', 'accepted')
              .single();

            const roleName = cohostReq ? 'co-host' : 'user';

            // Post system message: User / Co-host joined
            await supabaseAdmin.from('stream_messages').insert({
              stream_id: stream.id,
              user_id: participantIdentity,
              content: `${user.username} (${roleName}) joined the stream`,
              type: 'system'
            });
          }
        }
      } 
      
      else if (eventName === 'participant_left') {
        const participantIdentity = event.participant?.identity || '';
        const isAnon = participantIdentity.startsWith('anon_');

        // Decrement count
        const newViewerCount = Math.max(0, (stream.viewer_count || 0) - 1);
        await supabaseAdmin
          .from('streams')
          .update({ viewer_count: newViewerCount })
          .eq('id', stream.id);

        if (!isAnon && participantIdentity) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('username')
            .eq('id', participantIdentity)
            .single();

          if (user) {
            // Update stream_viewers leave tracking
            const { data: session } = await supabaseAdmin
              .from('stream_viewers')
              .select('id, joined_at')
              .eq('stream_id', stream.id)
              .eq('user_id', participantIdentity)
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

            // Check if co-host
            const { data: cohostReq } = await supabaseAdmin
              .from('cohost_requests')
              .select('status')
              .eq('stream_id', stream.id)
              .eq('user_id', participantIdentity)
              .eq('status', 'accepted')
              .single();

            const roleName = cohostReq ? 'co-host' : 'user';

            // Post system message: User / Co-host left
            await supabaseAdmin.from('stream_messages').insert({
              stream_id: stream.id,
              user_id: participantIdentity,
              content: `${user.username} (${roleName}) left the stream`,
              type: 'system'
            });
          }
        }
      }
    }

    // Handle Call room events
    else if (roomName.startsWith('call_')) {
      const { data: callSession } = await supabaseAdmin
        .from('call_sessions')
        .select('*')
        .eq('livekit_room_name', roomName)
        .single();

      if (callSession) {
        if (eventName === 'room_started') {
          await supabaseAdmin
            .from('call_sessions')
            .update({ status: 'active', started_at: new Date().toISOString() })
            .eq('id', callSession.id);
        } 
        
        else if (eventName === 'room_finished') {
          // If the call session is not ended yet, trigger the billing fallback
          if (callSession.status === 'active') {
            const startedAt = callSession.started_at || callSession.created_at;
            const durationMins = Math.ceil((Date.now() - new Date(startedAt).getTime()) / 60000);
            const durationSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
            const totalCost = durationMins * (callSession.coin_rate_per_minute || 10);
            const creatorDiamonds = Math.floor(totalCost * 0.5);

            await supabaseAdmin
              .from('call_sessions')
              .update({
                status: 'ended',
                ended_at: new Date().toISOString(),
                total_coins_charged: totalCost,
              })
              .eq('id', callSession.id);

            if (totalCost > 0) {
              // 1. Deduct from Caller
              const { data: callerWallet } = await supabaseAdmin.from('wallets').select('id, coin_balance').eq('user_id', callSession.caller_id).single();
              if (callerWallet) {
                await supabaseAdmin.from('wallets').update({ coin_balance: Math.max(0, callerWallet.coin_balance - totalCost) }).eq('id', callerWallet.id);
                await supabaseAdmin.from('wallet_transactions').insert({
                  wallet_id: callerWallet.id,
                  type: 'call_spent',
                  amount: 0,
                  coins_delta: -totalCost,
                  diamonds_delta: 0,
                  reference_id: callSession.id,
                  description: `Audio/video call (${durationMins} min) - Webhook fallback`,
                });
              }

              // 2. Add Diamonds to Callee
              const { data: calleeWallet } = await supabaseAdmin.from('wallets').select('id, diamond_balance').eq('user_id', callSession.callee_id).single();
              if (calleeWallet) {
                await supabaseAdmin.from('wallets').update({ diamond_balance: calleeWallet.diamond_balance + creatorDiamonds }).eq('id', calleeWallet.id);
                await supabaseAdmin.from('wallet_transactions').insert({
                  wallet_id: calleeWallet.id,
                  type: 'call_earned',
                  amount: 0,
                  coins_delta: 0,
                  diamonds_delta: creatorDiamonds,
                  reference_id: callSession.id,
                  description: `Received call (${durationMins} min) - Webhook fallback`,
                });
              }

              // 3. Insert into call_billing
              await supabaseAdmin.from('call_billing').insert({
                session_id: callSession.id,
                caller_id: callSession.caller_id,
                callee_id: callSession.callee_id,
                duration_seconds: durationSeconds,
                total_coins: totalCost,
                creator_diamonds: creatorDiamonds
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[livekit/webhook]', err);
    return NextResponse.json({ error: err.message || 'Signature verification failed' }, { status: 400 });
  }
}
