import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('devpulse_token')?.value;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 401,
        message: 'Unauthorized: No active session',
        errors: [],
      },
      { status: 401 }
    );
  }

  try {
    const backendRes = await fetch(`${API_BASE_URL}/auth/admin-check`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        message: `Failed to verify admin access: ${message}`,
        errors: [],
      },
      { status: 500 }
    );
  }
}
