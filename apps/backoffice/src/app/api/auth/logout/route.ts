import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  cookieStore.set('livehub_session', '', { path: '/', maxAge: 0, httpOnly: true });
  cookieStore.set('livehub_role', '', { path: '/', maxAge: 0 });
  
  return NextResponse.json({ success: true });
}
