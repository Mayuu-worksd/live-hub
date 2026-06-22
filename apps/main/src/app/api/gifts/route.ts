import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const DIAMOND_RATE = 0.5; // 1 coin = 0.5 diamonds

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverId, streamId, giftId, quantity } = await req.json();

    if (!senderId || !receiverId || !streamId || !giftId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get gift details
    const { data: gift } = await supabaseAdmin
      .from('gift_catalog')
      .select('*')
      .eq('id', giftId)
      .eq('is_active', true)
      .single();

    if (!gift) return NextResponse.json({ error: 'Gift not found' }, { status: 404 });

    const totalCost = gift.coin_cost * quantity;
    const diamondsEarned = Math.floor(totalCost * DIAMOND_RATE);

    // Verify stream is live
    const { data: stream } = await supabaseAdmin
      .from('streams')
      .select('status, host_id')
      .eq('id', streamId)
      .single();

    if (!stream || stream.status !== 'live') {
      return NextResponse.json({ error: 'Stream is not live' }, { status: 400 });
    }

    // Deduct coins from sender wallet (server-side balance check)
    const { data: senderWallet } = await supabaseAdmin
      .from('wallets')
      .select('id, coin_balance')
      .eq('user_id', senderId)
      .single();

    if (!senderWallet || senderWallet.coin_balance < totalCost) {
      return NextResponse.json({ error: 'Insufficient coins' }, { status: 402 });
    }

    // Atomic wallet updates + gift record in a DB function call
    const { error: deductError } = await supabaseAdmin
      .from('wallets')
      .update({ coin_balance: senderWallet.coin_balance - totalCost })
      .eq('id', senderWallet.id);

    if (deductError) return NextResponse.json({ error: deductError.message }, { status: 500 });

    // Insert stream_gifts row first to get the reference ID
    const { data: streamGift } = await supabaseAdmin
      .from('stream_gifts')
      .insert({
        stream_id: streamId,
        sender_id: senderId,
        receiver_id: receiverId,
        gift_id: giftId,
        quantity,
        coins_spent: totalCost,
        diamonds_earned: diamondsEarned,
      })
      .select()
      .single();

    if (streamGift) {
      // Log sender transaction
      await supabaseAdmin.from('wallet_transactions').insert({
        wallet_id: senderWallet.id,
        type: 'gift_sent',
        amount: 0,
        coins_delta: -totalCost,
        diamonds_delta: 0,
        reference_id: streamGift.id,
        description: `Sent ${quantity}x ${gift.name} in stream`,
      });
    }

    // Credit diamonds to creator
    await supabaseAdmin.rpc('increment_diamonds', {
      p_user_id: receiverId,
      p_amount: diamondsEarned,
    });

    if (streamGift) {
      // Log receiver transaction
      const { data: receiverWallet } = await supabaseAdmin.from('wallets').select('id').eq('user_id', receiverId).single();
      if (receiverWallet) {
        await supabaseAdmin.from('wallet_transactions').insert({
          wallet_id: receiverWallet.id,
          type: 'gift_received',
          amount: 0,
          coins_delta: 0,
          diamonds_delta: diamondsEarned,
          reference_id: streamGift.id,
          description: `Received ${quantity}x ${gift.name} in stream`,
        });
      }
    }

    // Insert gift chat message
    await supabaseAdmin.from('stream_messages').insert({
      stream_id: streamId,
      user_id: senderId,
      content: `sent ${quantity}× ${gift.name}`,
      type: 'gift',
      metadata: { gift_id: giftId, gift_name: gift.name, quantity, emoji: gift.emoji },
    });

    // Update stream total_gifts_received
    await supabaseAdmin.rpc('increment_stream_gifts', {
      p_stream_id: streamId,
      p_amount: diamondsEarned,
    });

    return NextResponse.json({ ok: true, streamGift, coinsSpent: totalCost, diamondsEarned });
  } catch (err) {
    console.error('[gifts POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
