import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { videoId, viewerId } = await req.json();

    if (!videoId || !viewerId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Check if video is premium and get price
    const { data: video } = await supabaseAdmin.from('videos').select('coin_price, post:posts(author_id)').eq('id', videoId).single();
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    
    if (video.coin_price === 0) {
      return NextResponse.json({ ok: true }); // already free
    }

    // Check if already purchased
    const { data: existing } = await supabaseAdmin.from('video_purchases').select('id').eq('buyer_id', viewerId).eq('video_id', videoId).single();
    if (existing) {
      return NextResponse.json({ ok: true });
    }

    // Check viewer wallet
    const { data: wallet } = await supabaseAdmin.from('wallets').select('id, coin_balance').eq('user_id', viewerId).single();
    if (!wallet || wallet.coin_balance < video.coin_price) {
      return NextResponse.json({ error: 'Insufficient coins' }, { status: 402 });
    }

    // Deduct coins
    await supabaseAdmin.from('wallets').update({ coin_balance: wallet.coin_balance - video.coin_price }).eq('id', wallet.id);

    // Credit creator diamonds (e.g. 50% conversion)
    const postData = video.post as any;
    const creatorId = Array.isArray(postData) ? postData[0]?.author_id : postData?.author_id;
    if (!creatorId) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    const { data: creatorWallet } = await supabaseAdmin.from('wallets').select('id, diamond_balance').eq('user_id', creatorId).single();
    if (creatorWallet) {
      const diamondsEarned = Math.floor(video.coin_price * 0.5);
      await supabaseAdmin.from('wallets').update({ diamond_balance: creatorWallet.diamond_balance + diamondsEarned }).eq('id', creatorWallet.id);
    }

    // Record purchase
    const { data: purchase, error } = await supabaseAdmin.from('video_purchases').insert({
      buyer_id: viewerId,
      video_id: videoId,
      coins_spent: video.coin_price
    }).select().single();

    if (error) throw error;

    // Log buyer transaction
    await supabaseAdmin.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'content_unlocked',
      amount: 0,
      coins_delta: -video.coin_price,
      diamonds_delta: 0,
      reference_id: purchase.id,
      description: `Unlocked premium video`,
    });

    if (creatorWallet) {
      // Log creator transaction
      const diamondsEarned = Math.floor(video.coin_price * 0.5);
      await supabaseAdmin.from('wallet_transactions').insert({
        wallet_id: creatorWallet.id,
        type: 'content_revenue',
        amount: 0,
        coins_delta: 0,
        diamonds_delta: diamondsEarned,
        reference_id: purchase.id,
        description: `Premium video unlocked by user`,
      });
    }

    return NextResponse.json({ purchase });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
