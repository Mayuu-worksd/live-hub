import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const searchTerm = `%${query.trim()}%`;
    
    // We search profiles based on display_name OR user's username
    // Note: Due to Supabase RPC limitations we'll use a direct join if possible,
    // or search profiles and users separately.
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, 
        username, 
        role, 
        is_verified, 
        profile:profiles(display_name, avatar_url, followers_count)
      `)
      .or(`username.ilike.${searchTerm}`)
      .limit(20);

    const { data: profileMatches } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('display_name', searchTerm)
      .limit(20);

    const matchIds = new Set(data?.map(u => u.id) || []);
    if (profileMatches) {
      profileMatches.forEach(pm => matchIds.add(pm.id));
    }

    // Refetch the unified list
    const { data: finalResults } = await supabaseAdmin
      .from('users')
      .select(`
        id, 
        username, 
        role, 
        is_verified, 
        profile:profiles(display_name, avatar_url, followers_count)
      `)
      .in('id', Array.from(matchIds))
      .order('is_verified', { ascending: false }) // Verified users first
      .limit(20);

    return NextResponse.json({ results: finalResults || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
