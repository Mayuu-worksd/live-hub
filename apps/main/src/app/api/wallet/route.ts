import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('wallets')
    .select('coin_balance, diamond_balance, total_earned')
    .eq('user_id', userId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const { packageId, userId } = await req.json();

    const { data: pkg } = await supabaseAdmin
      .from('coin_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: pkg.name,
            description: `${pkg.coins + pkg.bonus_coins} coins total`,
          },
          unit_amount: Math.round(pkg.price_usd * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?cancelled=1`,
      metadata: {
        userId,
        packageId,
        coins: String(pkg.coins + pkg.bonus_coins),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[wallet POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
