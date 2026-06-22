import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { followerId, followingId, action } = await req.json();

    if (!followerId || !followingId || !action) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    if (action === 'follow') {
      // 1. Check target privacy
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_private')
        .eq('id', followingId)
        .single();
      
      const isPrivate = profile?.is_private ?? false;

      if (isPrivate) {
        // Send Follow Request
        const { error } = await supabaseAdmin.from('follow_requests').insert({ follower_id: followerId, following_id: followingId });
        if (error && error.code !== '23505') throw error;
        return NextResponse.json({ status: 'requested' });
      } else {
        // Instant Follow
        const { error } = await supabaseAdmin.from('followers').insert({ follower_id: followerId, following_id: followingId });
        if (error && error.code !== '23505') throw error;
        
        // Update counts manually
        const { data: fProfile } = await supabaseAdmin.from('profiles').select('followers_count').eq('id', followingId).single();
        const { data: mProfile } = await supabaseAdmin.from('profiles').select('following_count').eq('id', followerId).single();
        
        if (fProfile) await supabaseAdmin.from('profiles').update({ followers_count: fProfile.followers_count + 1 }).eq('id', followingId);
        if (mProfile) await supabaseAdmin.from('profiles').update({ following_count: mProfile.following_count + 1 }).eq('id', followerId);
        
        return NextResponse.json({ status: 'following' });
      }
    } else if (action === 'unfollow') {
      // Delete from both followers and follow_requests to be safe
      const { data: existingFollow } = await supabaseAdmin.from('followers').select('id').match({ follower_id: followerId, following_id: followingId }).single();
      
      await supabaseAdmin.from('followers').delete().match({ follower_id: followerId, following_id: followingId });
      await supabaseAdmin.from('follow_requests').delete().match({ follower_id: followerId, following_id: followingId });
      
      if (existingFollow) {
        const { data: fProfile } = await supabaseAdmin.from('profiles').select('followers_count').eq('id', followingId).single();
        const { data: mProfile } = await supabaseAdmin.from('profiles').select('following_count').eq('id', followerId).single();
        
        if (fProfile && fProfile.followers_count > 0) 
          await supabaseAdmin.from('profiles').update({ followers_count: fProfile.followers_count - 1 }).eq('id', followingId);
        if (mProfile && mProfile.following_count > 0) 
          await supabaseAdmin.from('profiles').update({ following_count: mProfile.following_count - 1 }).eq('id', followerId);
      }
      return NextResponse.json({ status: 'unfollowed' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
