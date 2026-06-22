import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

async function getUser(req: NextRequest) {
  const session = req.cookies.get('livehub_session')?.value;
  if (!session) return null;
  try {
    const [, payloadB64] = session.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('firebase_uid', payload.sub).single();
    return user;
  } catch (err) {
    return null;
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const body = await req.json();
    const updateData: any = {};

    if (typeof body.is_private === 'boolean') {
      updateData.is_private = body.is_private;
    }
    
    if (body.message_privacy && ['everyone', 'followers', 'nobody'].includes(body.message_privacy)) {
      updateData.message_privacy = body.message_privacy;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true, updated: updateData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
