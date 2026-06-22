import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { addCoins, setCoinRate, role, is_banned, is_verified } = await req.json();

    if (addCoins !== undefined) {
      // Get current balance
      const { data: wallet } = await supabaseAdmin.from('wallets').select('id, coin_balance').eq('user_id', id).single();
      if (wallet) {
        await supabaseAdmin.from('wallets').update({ coin_balance: wallet.coin_balance + addCoins }).eq('id', wallet.id);
      }
    }

    if (setCoinRate !== undefined) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('id', id).single();
      if (profile) {
        await supabaseAdmin.from('profiles').update({ coin_rate_per_minute: setCoinRate }).eq('id', id);
      } else {
        await supabaseAdmin.from('profiles').insert({ id, display_name: 'Creator', coin_rate_per_minute: setCoinRate });
      }
    }

    const updates: any = {};
    if (role !== undefined) updates.role = role;
    if (is_banned !== undefined) updates.is_banned = is_banned;
    if (is_verified !== undefined) updates.is_verified = is_verified;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin.from('users').update(updates).eq('id', id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
