import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    const roleCookie = request.cookies.get('livehub_role')?.value;
    
    if (roleCookie !== 'agency_manager' && roleCookie !== 'agency' && roleCookie !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch creators and their profiles
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, username, email, role, is_banned,
        profile:profiles(display_name, followers_count, total_earned)
      `)
      .in('role', ['creator', 'verified_creator']); // Fetch both creator types

    if (error) {
      console.error('Supabase error fetching creators:', error);
      // Fallback to empty array if error occurs
      return NextResponse.json({ data: [] });
    }

    const formattedData = (data || []).map((user: any) => ({
      id: user.id,
      name: user.profile?.display_name || user.username,
      status: user.is_banned ? 'Banned' : 'Active',
      followers: user.profile?.followers_count || 0,
      periodEarnings: `$${(user.profile?.total_earned || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }));

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error('Error fetching agency creators:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
