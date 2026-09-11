import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('devpulse_token');

  return NextResponse.json({
    success: true,
    data: null,
    message: 'Logged out successfully',
  });
}
