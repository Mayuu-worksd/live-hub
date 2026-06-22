import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const MIN_DIAMONDS = 10000;

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabaseAdmin
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return NextResponse.json({ withdrawals: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId, diamondAmount, paymentMethod, paymentDetails } = await req.json();

  if (!userId || !diamondAmount || !paymentMethod) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (diamondAmount < MIN_DIAMONDS) {
    return NextResponse.json({ error: `Minimum ${MIN_DIAMONDS} diamonds required` }, { status: 400 });
  }

  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('id, diamond_balance, pending_withdrawal')
    .eq('user_id', userId)
    .single();

  if (!wallet || wallet.diamond_balance < diamondAmount) {
    return NextResponse.json({ error: 'Insufficient diamond balance' }, { status: 402 });
  }

  // Hold diamonds
  await supabaseAdmin.from('wallets').update({
    diamond_balance: wallet.diamond_balance - diamondAmount,
    pending_withdrawal: wallet.pending_withdrawal + diamondAmount,
  }).eq('id', wallet.id);

  const { data: withdrawal } = await supabaseAdmin
    .from('withdrawals')
    .insert({
      user_id: userId,
      diamond_amount: diamondAmount,
      payment_method: paymentMethod,
      payment_details: paymentDetails,
      status: 'pending',
    })
    .select()
    .single();

  if (withdrawal) {
    await supabaseAdmin.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'withdrawal_hold',
      amount: 0,
      coins_delta: 0,
      diamonds_delta: -diamondAmount,
      reference_id: withdrawal.id,
      description: `Pending withdrawal`,
    });
  }

  return NextResponse.json({ withdrawal });
}
