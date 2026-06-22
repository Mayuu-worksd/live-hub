import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { RoomServiceClient } from 'livekit-server-sdk';

const roomService = new RoomServiceClient(
  process.env.NEXT_PUBLIC_LIVEKIT_URL!.replace('wss://', 'https://'),
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('streams')
    .select(`*, host:users!host_id(id, username, profile:profiles(display_name, avatar_url))`)
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ stream: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === 'end') {
    const { data: stream } = await supabaseAdmin
      .from('streams')
      .select('livekit_room_name')
      .eq('id', id)
      .single();

    if (stream) {
      try {
        await roomService.deleteRoom(stream.livekit_room_name);
      } catch {
        // Room may already be gone
      }
    }

    const { error } = await supabaseAdmin
      .from('streams')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
