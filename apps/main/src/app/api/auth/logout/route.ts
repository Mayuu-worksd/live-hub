import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Delete the cookies by setting maxAge to 0 and path to /
  cookieStore.set('livehub_session', '', { path: '/', maxAge: 0, httpOnly: true });
  cookieStore.set('livehub_role', '', { path: '/', maxAge: 0 });
  cookieStore.set('livehub_onboarded', '', { path: '/', maxAge: 0 });
  
  return NextResponse.json({ ok: true });
}
