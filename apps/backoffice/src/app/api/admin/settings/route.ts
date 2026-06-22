import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

function isAdmin(req: NextRequest) {
  const role = req.cookies.get('livehub_role')?.value;
  return role === 'admin' || role === 'super_admin';
}

const DEFAULT_SETTINGS = [
  { setting_key: 'diamond_to_usd_rate', setting_value: { value: 0.005, label: 'Diamond → USD Rate', description: 'How many USD 1 diamond is worth during withdrawal', type: 'number' } },
  { setting_key: 'platform_fee_pct', setting_value: { value: 30, label: 'Platform Fee %', description: 'Percentage of coin spend kept by platform (gifts & calls)', type: 'number' } },
  { setting_key: 'min_withdrawal_diamonds', setting_value: { value: 1000, label: 'Minimum Withdrawal (Diamonds)', description: 'Minimum diamonds required to request a withdrawal', type: 'number' } },
  { setting_key: 'live_fee_pct', setting_value: { value: 30, label: 'Live Stream Fee %', description: 'Platform cut from live stream gifts', type: 'number' } },
  { setting_key: 'call_fee_pct', setting_value: { value: 20, label: 'Call Fee %', description: 'Platform cut from private call billing', type: 'number' } },
  { setting_key: 'max_withdrawal_per_month', setting_value: { value: 10000, label: 'Max Withdrawal/Month (Diamonds)', description: 'Maximum diamonds a creator can withdraw per calendar month', type: 'number' } },
];

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  // Fetch existing settings
  const { data, error } = await supabaseAdmin
    .from('admin_settings')
    .select('*')
    .order('setting_key');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-seed defaults for any missing keys
  if (!data || data.length < DEFAULT_SETTINGS.length) {
    const existingKeys = new Set((data ?? []).map((s: any) => s.setting_key));
    const toInsert = DEFAULT_SETTINGS.filter((d) => !existingKeys.has(d.setting_key));
    if (toInsert.length > 0) {
      await supabaseAdmin.from('admin_settings').insert(toInsert);
    }
    // Refetch after seeding
    const { data: seeded } = await supabaseAdmin.from('admin_settings').select('*').order('setting_key');
    return NextResponse.json({ data: seeded ?? [] });
  }

  return NextResponse.json({ data });
}
