import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

async function getUser(req: NextRequest) {
  const session = req.cookies.get('livehub_session')?.value;
  if (!session) return null;
  try {
    const [, payloadB64] = session.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    const { data: user } = await supabaseAdmin.from('users').select('id, username').eq('firebase_uid', payload.sub).single();
    return user;
  } catch (err) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const { data: convs, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        updated_at:created_at,
        is_approved,
        initiated_by,
        p1:users!participant_one(id, username, profile:profiles(display_name, avatar_url)),
        p2:users!participant_two(id, username, profile:profiles(display_name, avatar_url))
      `)
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);

    if (error) throw error;

    const convIds = convs.map(c => c.id);
    let messages: any[] = [];
    if (convIds.length > 0) {
      const { data: msgs } = await supabaseAdmin
        .from('messages')
        .select('conversation_id, content, sender_id, is_read, created_at, is_deleted')
        .in('conversation_id', convIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      messages = msgs || [];
    }

    const formatted = convs.map(c => {
      const p1 = c.p1 as any;
      const p2 = c.p2 as any;
      const isP1 = p1.id === user.id;
      const otherUser = isP1 ? p2 : p1;
      
      const convMsgs = messages.filter(m => m.conversation_id === c.id);
      const lastMessage = convMsgs.length > 0 ? convMsgs[0] : null;
      const unreadCount = convMsgs.filter(m => !m.is_read && m.sender_id !== user.id).length;

      return {
        id: c.id,
        is_approved: c.is_approved,
        initiated_by: c.initiated_by,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          avatar_url: otherUser.profile?.avatar_url,
          display_name: otherUser.profile?.display_name,
        },
        lastMessage: lastMessage ? lastMessage.content : '',
        updatedAt: lastMessage ? lastMessage.created_at : c.updated_at,
        unreadCount
      };
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ conversations: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const { receiverId, content, type = 'text' } = await req.json();
    if (!receiverId || (!content?.trim() && type === 'text')) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (receiverId === user.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Check block
    const { data: block } = await supabaseAdmin
      .from('user_blocks')
      .select('id')
      .or(`and(blocker_id.eq.${receiverId},blocked_id.eq.${user.id}),and(blocker_id.eq.${user.id},blocked_id.eq.${receiverId})`)
      .limit(1);
    if (block && block.length > 0) {
      return NextResponse.json({ error: 'Cannot send message to this user' }, { status: 403 });
    }

    // Check message_privacy of receiver
    const { data: profile } = await supabaseAdmin.from('profiles').select('message_privacy').eq('id', receiverId).single();
    const privacy = profile?.message_privacy || 'everyone';

    if (privacy === 'nobody') {
      return NextResponse.json({ error: 'User is not accepting messages' }, { status: 403 });
    }

    // Check if user follows receiver, or receiver follows user
    const { data: followers } = await supabaseAdmin.from('followers')
      .select('follower_id, following_id')
      .or(`and(follower_id.eq.${user.id},following_id.eq.${receiverId}),and(follower_id.eq.${receiverId},following_id.eq.${user.id})`);
    
    const isFollowingThem = followers?.some(f => f.follower_id === user.id);
    const theyFollowMe = followers?.some(f => f.follower_id === receiverId);

    if (privacy === 'followers' && !theyFollowMe) {
      return NextResponse.json({ error: 'User only accepts messages from followers' }, { status: 403 });
    }

    // If they don't follow me, it goes to message requests (is_approved = false)
    const isApproved = theyFollowMe;

    let { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id, is_approved')
      .or(`and(participant_one.eq.${user.id},participant_two.eq.${receiverId}),and(participant_one.eq.${receiverId},participant_two.eq.${user.id})`)
      .single();

    if (!conv) {
      const { data: newConv, error: convErr } = await supabaseAdmin
        .from('conversations')
        .insert({ 
          participant_one: user.id, 
          participant_two: receiverId,
          is_approved: isApproved,
          initiated_by: user.id
        })
        .select()
        .single();
      if (convErr) throw convErr;
      conv = newConv;
    }

    const { data: msg, error: msgErr } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conv!.id,
        sender_id: user.id,
        content: content.trim(),
        message_type: type
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    return NextResponse.json({ message: msg });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
