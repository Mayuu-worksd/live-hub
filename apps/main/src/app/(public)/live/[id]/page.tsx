import { supabaseAdmin } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LiveStreamClient from '@/components/stream/LiveStreamClient';

export default async function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: stream, error } = await supabaseAdmin
    .from('streams')
    .select(`
      *,
      host:users!host_id(id, username, profile:profiles(display_name, avatar_url))
    `)
    .eq('id', id)
    .single();

  if (error || !stream) {
    return notFound();
  }

  return <LiveStreamClient stream={stream} />;
}
