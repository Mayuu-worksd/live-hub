import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId: string = session.metadata?.userId;
    const packageId: string = session.metadata?.packageId;
    const coins: string = session.metadata?.coins;

    if (!userId || !coins) return NextResponse.json({ received: true });

    // 1. Idempotency Check: Has this session already been processed?
    const { data: existingTx } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id')
      .eq('reference_id', session.id)
      .eq('type', 'purchase')
      .single();

    if (existingTx) {
      console.log(`[Stripe Webhook] Session ${session.id} already processed. Ignoring.`);
      return NextResponse.json({ received: true });
    }

    // 2. Fetch Wallet
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id, coin_balance')
      .eq('user_id', userId)
      .single();

    if (!wallet) {
      console.error(`[Stripe Webhook] Wallet not found for user ${userId}`);
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const coinsToAdd = parseInt(coins);

    // 3. Update Wallet Balance
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ coin_balance: wallet.coin_balance + coinsToAdd })
      .eq('id', wallet.id);

    if (updateError) {
      console.error(`[Stripe Webhook] Failed to update wallet: ${updateError.message}`);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    // 4. Log Transaction (Ledger)
    await supabaseAdmin.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'purchase',
      amount: (session.amount_total ?? 0) / 100,
      coins_delta: coinsToAdd,
      diamonds_delta: 0,
      reference_id: session.id,
      description: `Coin package purchase (pkg: ${packageId})`,
    });
  }

  return NextResponse.json({ received: true });
}
