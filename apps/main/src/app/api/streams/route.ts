import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateLiveKitToken } from '@/lib/livekit/token';
import { RoomServiceClient } from 'livekit-server-sdk';

const roomService = new RoomServiceClient(
  process.env.NEXT_PUBLIC_LIVEKIT_URL!.replace('wss://', 'https://'),
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const interests = searchParams.get('interests')?.split(',').map(i => i.toLowerCase().trim()) || [];
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 20;

  const sort = searchParams.get('sort') || 'trending';

  let query = supabaseAdmin
    .from('streams')
    .select(`
      *,
      host:users!host_id(id, username, profile:profiles(display_name, avatar_url))
    `)
    .eq('status', 'live')
    .range((page - 1) * limit, page * limit - 1);

  if (sort === 'trending') {
    query = query.order('viewer_count', { ascending: false });
  } else if (sort === 'new') {
    query = query.order('created_at', { ascending: false });
  }

  if (category && category !== 'all') query = query.eq('category', category);

  const { data: rawData, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let data = rawData;

  if (data && interests.length > 0 && (!category || category === 'all')) {
    // Sort streams matching interests to the top, while preserving trending/new secondary sort
    const matches = data.filter(s => interests.includes(s.category.toLowerCase()));
    const others = data.filter(s => !interests.includes(s.category.toLowerCase()));
    data = [...matches, ...others];
  }

  return NextResponse.json({ streams: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hostId, title, category } = body;

    if (!hostId || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const roomName = `stream_${hostId}_${Date.now()}`;

    // Create LiveKit room
    await roomService.createRoom({ name: roomName, emptyTimeout: 300 });

    // Generate host token
    const token = await generateLiveKitToken(roomName, hostId, true);

    const { data: stream, error } = await supabaseAdmin
      .from('streams')
      .insert({
        host_id: hostId,
        livekit_room_name: roomName,
        title,
        category,
        status: 'live',
        viewer_count: 0,
        peak_viewers: 0,
        total_gifts_received: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ stream, token });
  } catch (err) {
    console.error('[streams POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
