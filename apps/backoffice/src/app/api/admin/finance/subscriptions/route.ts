import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

function isAdmin(req: NextRequest) {
  const role = req.cookies.get('livehub_role')?.value;
  return role === 'admin' || role === 'super_admin';
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  // Fetch all subscription plans with creator info and active subscriber count
  const { data: plans, error } = await supabaseAdmin
    .from('subscription_plans')
    .select(`
      id, name, coin_price, duration_days, benefits, created_at,
      creator:users!creator_id(id, username, is_verified)
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // For each plan, get active subscriber count
  const plansWithCounts = await Promise.all(
    (plans ?? []).map(async (plan) => {
      const { count } = await supabaseAdmin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', plan.id)
        .eq('status', 'active');
      return { ...plan, active_subscribers: count ?? 0 };
    })
  );

  return NextResponse.json({ data: plansWithCounts });
}
