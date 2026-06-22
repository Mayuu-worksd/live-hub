import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateLiveKitToken } from '@/lib/livekit/token';
import { RoomServiceClient } from 'livekit-server-sdk';

const roomService = new RoomServiceClient(
  process.env.NEXT_PUBLIC_LIVEKIT_URL!.replace('wss://', 'https://'),
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(req: NextRequest) {
  const { action, callerId, calleeId, callType, sessionId } = await req.json();

  if (action === 'initiate') {
    if (callerId === calleeId) {
      return NextResponse.json({ error: 'Cannot call yourself' }, { status: 400 });
    }

    // Check caller not already in a call
    const { data: activeCall } = await supabaseAdmin
      .from('call_sessions')
      .select('id')
      .or(`caller_id.eq.${callerId},callee_id.eq.${callerId}`)
      .eq('status', 'active')
      .single();

    if (activeCall) return NextResponse.json({ error: 'Already in a call' }, { status: 409 });

    const { data: session } = await supabaseAdmin
      .from('call_sessions')
      .insert({ caller_id: callerId, callee_id: calleeId, call_type: callType, status: 'ringing' })
      .select()
      .single();

    return NextResponse.json({ session });
  }

  if (action === 'accept') {
    const roomName = `call_${sessionId}_${Date.now()}`;
    await roomService.createRoom({ name: roomName, emptyTimeout: 120 });

    const { data: session } = await supabaseAdmin
      .from('call_sessions')
      .select('caller_id, callee_id')
      .eq('id', sessionId)
      .single();

    await supabaseAdmin
      .from('call_sessions')
      .update({ status: 'active', started_at: new Date().toISOString(), livekit_room_name: roomName })
      .eq('id', sessionId);

    const [callerToken, calleeToken] = await Promise.all([
      generateLiveKitToken(roomName, session!.caller_id, true),
      generateLiveKitToken(roomName, session!.callee_id, true),
    ]);

    return NextResponse.json({ callerToken, calleeToken, roomName });
  }

  if (action === 'end') {
    const { data: session } = await supabaseAdmin
      .from('call_sessions')
      .select('livekit_room_name, started_at, caller_id, callee_id, coin_rate_per_minute')
      .eq('id', sessionId)
      .single();

    if (session?.livekit_room_name) {
      try { await roomService.deleteRoom(session.livekit_room_name); } catch {}
    }

    const durationMins = session?.started_at
      ? Math.ceil((Date.now() - new Date(session.started_at).getTime()) / 60000)
      : 0;
    const durationSeconds = session?.started_at
      ? Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
      : 0;
      
    const totalCost = durationMins * (session?.coin_rate_per_minute ?? 0);
    const creatorDiamonds = Math.floor(totalCost * 0.5); // 50% conversion rate

    await supabaseAdmin
      .from('call_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        total_coins_charged: totalCost,
      })
      .eq('id', sessionId);

      if (totalCost > 0 && session) {
      // 1. Deduct from Caller
      const { data: callerWallet } = await supabaseAdmin.from('wallets').select('id, coin_balance').eq('user_id', session.caller_id).single();
      if (callerWallet) {
        await supabaseAdmin.from('wallets').update({ coin_balance: Math.max(0, callerWallet.coin_balance - totalCost) }).eq('id', callerWallet.id);
        await supabaseAdmin.from('wallet_transactions').insert({
          wallet_id: callerWallet.id,
          type: 'call_spent',
          amount: 0,
          coins_delta: -totalCost,
          diamonds_delta: 0,
          reference_id: sessionId,
          description: `Audio/video call (${durationMins} min)`,
        });
      }

      // 2. Add Diamonds to Callee
      const { data: calleeWallet } = await supabaseAdmin.from('wallets').select('id, diamond_balance').eq('user_id', session.callee_id).single();
      if (calleeWallet) {
        await supabaseAdmin.from('wallets').update({ diamond_balance: calleeWallet.diamond_balance + creatorDiamonds }).eq('id', calleeWallet.id);
        await supabaseAdmin.from('wallet_transactions').insert({
          wallet_id: calleeWallet.id,
          type: 'call_earned',
          amount: 0,
          coins_delta: 0,
          diamonds_delta: creatorDiamonds,
          reference_id: sessionId,
          description: `Received call (${durationMins} min)`,
        });
      }

      // 3. Insert into call_billing
      await supabaseAdmin.from('call_billing').insert({
        session_id: sessionId,
        caller_id: session.caller_id,
        callee_id: session.callee_id,
        duration_seconds: durationSeconds,
        total_coins: totalCost,
        creator_diamonds: creatorDiamonds
      });
    }

    return NextResponse.json({ ok: true, durationMins, totalCost });
  }

  if (action === 'decline') {
    await supabaseAdmin
      .from('call_sessions')
      .update({ status: 'missed' })
      .eq('id', sessionId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
