import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { action, creatorId, viewerId, planId, ...rest } = await req.json();

  if (action === 'create_plan') {
    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .insert({ creator_id: creatorId, ...rest })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ plan: data });
  }

  if (action === 'subscribe') {
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('coin_price, duration_days')
      .eq('id', planId)
      .single();

    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    // Deduct coins
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id, coin_balance')
      .eq('user_id', viewerId)
      .single();

    if (!wallet || wallet.coin_balance < plan.coin_price) {
      return NextResponse.json({ error: 'Insufficient coins' }, { status: 402 });
    }

    await supabaseAdmin
      .from('wallets')
      .update({ coin_balance: wallet.coin_balance - plan.coin_price })
      .eq('id', wallet.id);

    // Calculate creator revenue
    const diamondsEarned = Math.floor(plan.coin_price * 0.5);

    // Get creator wallet
    const { data: creatorWallet } = await supabaseAdmin
      .from('wallets')
      .select('id, diamond_balance')
      .eq('user_id', creatorId)
      .single();

    if (creatorWallet) {
      await supabaseAdmin
        .from('wallets')
        .update({ diamond_balance: creatorWallet.diamond_balance + diamondsEarned })
        .eq('id', creatorWallet.id);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        subscriber_id: viewerId,
        creator_id: creatorId,
        plan_id: planId,
        expires_at: expiresAt.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (sub) {
      // Log subscriber transaction
      await supabaseAdmin.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        type: 'subscription_paid',
        amount: 0,
        coins_delta: -plan.coin_price,
        diamonds_delta: 0,
        reference_id: sub.id,
        description: `Subscribed to creator`,
      });

      if (creatorWallet) {
        // Log creator transaction
        await supabaseAdmin.from('wallet_transactions').insert({
          wallet_id: creatorWallet.id,
          type: 'subscription_earned',
          amount: 0,
          coins_delta: 0,
          diamonds_delta: diamondsEarned,
          reference_id: sub.id,
          description: `New subscriber`,
        });
      }
    }

    return NextResponse.json({ subscription: sub });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
