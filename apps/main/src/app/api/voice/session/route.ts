import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

async function getAuthenticatedUser(req: NextRequest) {
  const session = req.cookies.get('livehub_session')?.value;
  if (!session) return null;
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
    const [, payloadB64] = session.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    if (payload.aud !== projectId) return null;

    const uid = payload.sub;
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role, username')
      .eq('firebase_uid', uid)
      .single();
    return user;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { livekit_room_name, model_id } = body;
    
    if (!livekit_room_name) {
      return NextResponse.json({ error: 'Missing livekit_room_name' }, { status: 400 });
    }

    const { data: session, error } = await supabaseAdmin
      .from('voice_sessions')
      .insert({
        user_id: authUser.id,
        livekit_room_name,
        model_id: model_id || null,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ session });
  } catch (err) {
    console.error('[voice/session POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { session_id, action } = body;

    if (!session_id || action !== 'end') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // End session
    const ended_at = new Date();
    
    const { data: sessionData, error: updateError } = await supabaseAdmin
      .from('voice_sessions')
      .update({ ended_at: ended_at.toISOString() })
      .eq('id', session_id)
      .eq('user_id', authUser.id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (sessionData) {
      const startedAt = new Date(sessionData.started_at).getTime();
      const durationSecs = Math.round((ended_at.getTime() - startedAt) / 1000);
      
      // Update duration
      await supabaseAdmin
        .from('voice_sessions')
        .update({ total_duration_seconds: durationSecs })
        .eq('id', session_id);
      
      // Log usage
      await supabaseAdmin
        .from('voice_usage_logs')
        .insert({
          session_id,
          user_id: authUser.id,
          duration_seconds: durationSecs,
          compute_cost_estimate: (durationSecs / 60) * 0.002 // Arbitrary calc for example
        });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[voice/session PATCH]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
