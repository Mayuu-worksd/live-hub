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
    
    if (roleCookie !== 'admin' && roleCookie !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching withdrawals:', error);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
