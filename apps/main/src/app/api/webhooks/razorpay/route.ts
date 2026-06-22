import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('x-razorpay-signature')!;

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (expectedSig !== sig) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const { userId, packageId, coins } = payment.notes;

    // 1. Idempotency Check: Has this payment already been processed?
    const { data: existingTx } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id')
      .eq('reference_id', payment.id)
      .eq('type', 'purchase')
      .single();

    if (existingTx) {
      console.log(`[Razorpay Webhook] Payment ${payment.id} already processed. Ignoring.`);
      return NextResponse.json({ received: true });
    }

    // 2. Fetch Wallet
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id, coin_balance')
      .eq('user_id', userId)
      .single();

    if (!wallet) {
      console.error(`[Razorpay Webhook] Wallet not found for user ${userId}`);
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const coinsToAdd = parseInt(coins);

    // 3. Update Wallet Balance
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ coin_balance: wallet.coin_balance + coinsToAdd })
      .eq('id', wallet.id);

    if (updateError) {
      console.error(`[Razorpay Webhook] Failed to update wallet: ${updateError.message}`);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    // 4. Log Transaction (Ledger)
    await supabaseAdmin.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'purchase',
      amount: payment.amount / 100,
      coins_delta: coinsToAdd,
      diamonds_delta: 0,
      reference_id: payment.id,
      description: `Razorpay coin purchase (pkg: ${packageId})`,
    });
  }

  return NextResponse.json({ received: true });
}
