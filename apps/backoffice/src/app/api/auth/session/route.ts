import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string; name?: string }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  const [headerB64, payloadB64, sigB64] = token.split('.');
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());

  const keysRes = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
    { next: { revalidate: 3600 } }
  );
  if (!keysRes.ok) throw new Error('Failed to fetch Firebase public keys');
  const { keys }: { keys: (JsonWebKey & { kid: string })[] } = await keysRes.json();

  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Unknown kid in token header');

  const pubKey = await crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['verify']
  );

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = Buffer.from(sigB64, 'base64url');
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pubKey, sig, data);
  if (!valid) throw new Error('Invalid token signature');

  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error('Token expired');
  if (payload.aud !== projectId) throw new Error('Token audience mismatch');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Token issuer mismatch');
  if (!payload.sub) throw new Error('Missing subject');

  return { uid: payload.sub, email: payload.email, name: payload.name };
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) return NextResponse.json({ error: 'Missing ID token' }, { status: 400 });

    let decoded: { uid: string; email?: string; name?: string };
    try {
      decoded = await verifyFirebaseToken(idToken);
    } catch (err) {
      console.error('Token verification failed:', err);
      return NextResponse.json({ error: 'Invalid token', detail: String(err) }, { status: 401 });
    }

    const { uid, email = '', name } = decoded;
    const displayName = name || email.split('@')[0];

    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('firebase_uid', uid)
      .single();

    let userRole = 'viewer';

    if (fetchError && fetchError.code === 'PGRST116') {
      const lowerEmail = email.toLowerCase();
      if (lowerEmail.includes('super')) userRole = 'super_admin';
      else if (lowerEmail.includes('admin')) userRole = 'admin';
      else if (lowerEmail.includes('agency')) userRole = 'agency_manager';
      else if (lowerEmail.includes('moderator')) userRole = 'moderator';

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          firebase_uid: uid,
          email,
          username: displayName + Math.floor(Math.random() * 10000),
          role: userRole,
          is_verified: false,
        })
        .select('role')
        .single();

      if (insertError) {
        console.error('Failed to create user:', insertError);
        return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
      }
      if (newUser) userRole = newUser.role;
    } else if (existingUser) {
      userRole = existingUser.role;
    }

    const cookieStore = await cookies();
    cookieStore.set('livehub_session', idToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set('livehub_role', userRole, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, role: userRole });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: String(error) }, { status: 500 });
  }
}
