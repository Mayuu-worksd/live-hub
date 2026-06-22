import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { followerId, followingId, action } = await req.json();

    if (!followerId || !followingId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    if (action === 'accept') {
      // 1. Delete the request
      const { data: request, error } = await supabaseAdmin
        .from('follow_requests')
        .delete()
        .match({ follower_id: followerId, following_id: followingId })
        .select()
        .single();

      if (!request) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }

      // 2. Insert into followers
      const { error: insertErr } = await supabaseAdmin
        .from('followers')
        .insert({ follower_id: followerId, following_id: followingId });

      if (insertErr && insertErr.code !== '23505') throw insertErr;

      // 3. Update counts manually
      const { data: fProfile } = await supabaseAdmin.from('profiles').select('followers_count').eq('id', followingId).single();
      const { data: mProfile } = await supabaseAdmin.from('profiles').select('following_count').eq('id', followerId).single();
      
      if (fProfile) await supabaseAdmin.from('profiles').update({ followers_count: fProfile.followers_count + 1 }).eq('id', followingId);
      if (mProfile) await supabaseAdmin.from('profiles').update({ following_count: mProfile.following_count + 1 }).eq('id', followerId);

      return NextResponse.json({ ok: true, status: 'accepted' });

    } else if (action === 'reject') {
      // Just delete the request
      await supabaseAdmin
        .from('follow_requests')
        .delete()
        .match({ follower_id: followerId, following_id: followingId });

      return NextResponse.json({ ok: true, status: 'rejected' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { followerId, followingId } = await req.json();

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Cancel sent request
    await supabaseAdmin
      .from('follow_requests')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });

    return NextResponse.json({ ok: true, status: 'cancelled' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
