import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Verify Firebase ID token using Google's public keys — no firebase-admin / jwks-rsa needed
async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

  // Decode header to get kid
  const [headerB64] = token.split('.');
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());

  // Fetch Google public keys (JWK format)
  const keysRes = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
    { next: { revalidate: 3600 } }
  );
  if (!keysRes.ok) throw new Error('Failed to fetch Firebase public keys');
  const { keys }: { keys: (JsonWebKey & { kid: string })[] } = await keysRes.json();

  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Unknown kid in token header');

  // Import the public key directly from JWK
  const pubKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // Verify signature
  const [, payloadB64, sigB64] = token.split('.');
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = Buffer.from(sigB64, 'base64url');
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pubKey, sig, data);
  if (!valid) throw new Error('Invalid token signature');

  // Decode and validate claims
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error('Token expired');
  if (payload.iat > now + 300) throw new Error('Token issued in the future');
  if (payload.aud !== projectId) throw new Error('Token audience mismatch');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Token issuer mismatch');
  if (!payload.sub) throw new Error('Missing subject');

  return { uid: payload.sub, email: payload.email };
}

export async function POST(req: NextRequest) {
  try {
    const { token, username } = await req.json();
    if (!token) return NextResponse.json({ error: 'No token provided' }, { status: 400 });

    let decoded: { uid: string; email?: string };
    try {
      decoded = await verifyFirebaseToken(token);
    } catch (err) {
      console.error('[auth/sync] token verification failed:', err);
      return NextResponse.json({ error: 'Invalid token', detail: String(err) }, { status: 401 });
    }

    const { uid, email } = decoded;

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('firebase_uid', uid)
      .single();

    let user = existingUser;

    if (!user) {
      const base =
        username ||
        email?.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 20) ||
        uid.slice(0, 10);

      const { data: taken } = await supabaseAdmin
        .from('users').select('id').eq('username', base).single();

      const finalUsername = taken
        ? `${base}${Math.floor(Math.random() * 9000) + 1000}`
        : base;

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          firebase_uid: uid,
          email: email ?? '',
          username: finalUsername,
          role: 'viewer',
          platform: 'public',
          onboarding_completed: false,
          is_verified: false,
          is_banned: false,
        })
        .select()
        .single();

      if (insertError) {
        // Duplicate key — user was created in a parallel request, just fetch them
        if (insertError.code === '23505') {
          const { data: racedUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('firebase_uid', uid)
            .single();
          if (racedUser) {
            user = racedUser;
          } else {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
          }
        } else {
          console.error('[auth/sync] insert failed:', insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      } else {
        user = newUser;
      }

      if (!existingUser) {
        await Promise.all([
          supabaseAdmin.from('profiles').insert({ id: user.id }).select().single(),
          supabaseAdmin.from('wallets').insert({
            user_id: user.id,
            coin_balance: 0,
            diamond_balance: 0,
            pending_withdrawal: 0,
            total_earned: 0,
          }).select().single(),
        ]).catch(() => {}); // ignore if already exist
      }
    }

    if (user && username && user.username !== username) {
      const { data: taken } = await supabaseAdmin
        .from('users').select('id').eq('username', username).single();

      const finalUsername = taken
        ? `${username}${Math.floor(Math.random() * 9000) + 1000}`
        : username;

      const { data: updatedUser } = await supabaseAdmin
        .from('users')
        .update({ username: finalUsername })
        .eq('id', user.id)
        .select()
        .single();

      if (updatedUser) {
        user = updatedUser;
      }
    }

    const cookieOpts = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    };

    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      onboarding_completed: user.onboarding_completed,
      role: user.role,
    });

    res.cookies.set('livehub_session', token, { ...cookieOpts, httpOnly: true });
    res.cookies.set('livehub_role', user.role, cookieOpts);
    res.cookies.set('livehub_onboarded', String(user.onboarding_completed), cookieOpts);

    return res;
  } catch (err) {
    console.error('[auth/sync] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 });
  }
}
