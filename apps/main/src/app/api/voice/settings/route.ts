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

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let { data: settings } = await supabaseAdmin
      .from('voice_settings')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    if (!settings) {
      // Create default settings if they don't exist
      const { data: newSettings, error } = await supabaseAdmin
        .from('voice_settings')
        .insert({
          user_id: authUser.id,
          accent: 'original',
          quality: 'standard',
          noise_reduction: 'off',
          is_enabled: false
        })
        .select()
        .single();
      
      if (error) throw error;
      settings = newSettings;
    }

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('[voice/settings GET]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const updateData: any = {};
    if (body.accent !== undefined) updateData.accent = body.accent;
    if (body.quality !== undefined) updateData.quality = body.quality;
    if (body.noise_reduction !== undefined) updateData.noise_reduction = body.noise_reduction;
    if (body.is_enabled !== undefined) updateData.is_enabled = body.is_enabled;
    updateData.updated_at = new Date().toISOString();

    const { data: settings, error } = await supabaseAdmin
      .from('voice_settings')
      .upsert({ user_id: authUser.id, ...updateData }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('[voice/settings PATCH]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
