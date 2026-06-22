import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const session = req.cookies.get('livehub_session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const { role, interests, display_name, bio } = await req.json();
    if (!role) return NextResponse.json({ error: 'No role' }, { status: 400 });

    const [, payloadB64] = session.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const uid = payload.sub;

    const { data: user, error: userFetchErr } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .eq('firebase_uid', uid)
      .single();

    if (userFetchErr || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await Promise.all([
      supabaseAdmin
        .from('users')
        .update({ role, onboarding_completed: true })
        .eq('id', user.id),
      supabaseAdmin
        .from('profiles')
        .update({
          display_name: display_name || user.username,
          bio: bio || null,
          interests: interests || [],
        })
        .eq('id', user.id),
    ]);

    const cookieOpts = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    };

    const res = NextResponse.json({ ok: true });
    res.cookies.set('livehub_role', role, cookieOpts);
    res.cookies.set('livehub_onboarded', 'true', cookieOpts);
    return res;
  } catch (err) {
    console.error('[onboard] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
