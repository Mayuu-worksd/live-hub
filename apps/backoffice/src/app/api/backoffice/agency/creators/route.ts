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

    // Attempt to query agency members/creators.
    // If the table doesn't exist yet, this will gracefully fail and we can return an empty array.
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, role, status')
      .eq('role', 'creator'); // Simplified for now, real implementation would join agency_members

    if (error) {
      console.error('Supabase error fetching creators:', error);
      // Fallback to empty array if table doesn't exist or error occurs
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching agency creators:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
