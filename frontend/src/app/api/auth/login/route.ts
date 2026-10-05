import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          statusCode: data.statusCode || backendRes.status,
          message: data.message || "Authentication failed",
          errors: data.errors || [],
        },
        {
          status: data.statusCode || backendRes.status,
        },
      );
    }

    const { accessToken, refreshToken, user } = data.data;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        {
          success: false,
          statusCode: 502,
          message: "Authentication service returned an invalid token response",
          errors: [],
        },
        {
          status: 502,
        },
      );
    }

    const cookieStore = await cookies();

    /*
    |--------------------------------------------------------------------------
    | Access-token cookie
    |--------------------------------------------------------------------------
    |
    | Short-lived token used by the existing BFF proxy routes when calling
    | protected NestJS endpoints.
    |
    */

    cookieStore.set("devpulse_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    /*
    |--------------------------------------------------------------------------
    | Refresh-token cookie
    |--------------------------------------------------------------------------
    |
    | Long-lived token used only to renew the session.
    |
    | Browser JavaScript cannot read this cookie because it is httpOnly.
    |
    */

    cookieStore.set("devpulse_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    /*
    |--------------------------------------------------------------------------
    | Never return raw tokens to browser JavaScript
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success: true,
      data: {
        user,
      },
      message: data.message || "Login successful",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        message: "Failed to communicate with auth service",
        errors: [],
      },
      {
        status: 500,
      },
    );
  }
}
