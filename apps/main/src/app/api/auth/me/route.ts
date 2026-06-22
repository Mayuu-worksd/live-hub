import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const session = req.cookies.get('livehub_session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
    const [, payloadB64] = session.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    if (payload.aud !== projectId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const uid = payload.sub;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('firebase_uid', uid)
      .single();

    if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [profileRes, walletRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', user.id).single(),
      supabaseAdmin.from('wallets').select('coin_balance, diamond_balance').eq('user_id', user.id).single(),
    ]);

    const res = NextResponse.json({
      user,
      profile: profileRes.data ?? null,
      wallet: walletRes.data ?? null,
    });

    // Refresh role cookie to sync admin changes to the middleware
    res.cookies.set('livehub_role', user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
