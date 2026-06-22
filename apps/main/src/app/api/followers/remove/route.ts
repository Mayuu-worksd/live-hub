import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(req: NextRequest) {
  try {
    const { followerId, followingId } = await req.json();

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Force remove a follower
    const { data: existingFollow } = await supabaseAdmin
      .from('followers')
      .select('id')
      .match({ follower_id: followerId, following_id: followingId })
      .single();
      
    if (existingFollow) {
      await supabaseAdmin.from('followers').delete().match({ follower_id: followerId, following_id: followingId });

      const { data: fProfile } = await supabaseAdmin.from('profiles').select('followers_count').eq('id', followingId).single();
      const { data: mProfile } = await supabaseAdmin.from('profiles').select('following_count').eq('id', followerId).single();
      
      if (fProfile && fProfile.followers_count > 0) 
        await supabaseAdmin.from('profiles').update({ followers_count: fProfile.followers_count - 1 }).eq('id', followingId);
      if (mProfile && mProfile.following_count > 0) 
        await supabaseAdmin.from('profiles').update({ following_count: mProfile.following_count - 1 }).eq('id', followerId);
    }

    return NextResponse.json({ ok: true, status: 'removed' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
