import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Call NestJS backend to create user
    const backendRes = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          statusCode: data.statusCode || backendRes.status,
          message: data.message || 'Registration failed',
          errors: data.errors || [],
        },
        { status: data.statusCode || backendRes.status }
      );
    }

    // 2. Automatically log the user in to issue JWT and set httpOnly cookie
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    });

    const loginData = await loginRes.json();

    if (loginRes.ok && loginData.success && loginData.data?.accessToken) {
      const { accessToken, user } = loginData.data;

      // Set httpOnly cookie
      const cookieStore = await cookies();
      cookieStore.set('devpulse_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return NextResponse.json({
        success: true,
        data: {
          user,
        },
        message: 'Account created and session authenticated',
      });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        message: `Failed to communicate with auth service: ${message}`,
        errors: [],
      },
      { status: 500 }
    );
  }
}
