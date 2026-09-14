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

    // 2. Clear any lingering session cookie so newly registered user is unauthenticated
    const cookieStore = await cookies();
    cookieStore.delete('devpulse_token');

    // 3. Return clean registration success without auto-login so user is redirected to sign-in
    return NextResponse.json({
      success: true,
      statusCode: 201,
      message: data.message || 'Account created successfully! Please sign in with your credentials.',
      data: data.data,
    });
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
