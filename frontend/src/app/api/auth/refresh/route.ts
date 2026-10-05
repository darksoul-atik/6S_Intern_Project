import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST() {
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get("devpulse_refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 401,
        message: "Refresh token is missing",
        errors: [],
      },
      {
        status: 401,
      },
    );
  }

  try {
    const backendRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      /*
      |--------------------------------------------------------------------------
      | Refresh failed
      |--------------------------------------------------------------------------
      |
      | Clear both cookies immediately. There is no valid session to preserve.
      |
      */

      cookieStore.delete("devpulse_token");
      cookieStore.delete("devpulse_refresh_token");

      return NextResponse.json(
        {
          success: false,
          statusCode: data.statusCode || backendRes.status,
          message: data.message || "Session refresh failed",
          errors: data.errors || [],
        },
        {
          status: data.statusCode || backendRes.status,
        },
      );
    }

    const { accessToken, refreshToken: newRefreshToken, user } = data.data;

    if (!accessToken || !newRefreshToken) {
      cookieStore.delete("devpulse_token");

      cookieStore.delete("devpulse_refresh_token");

      return NextResponse.json(
        {
          success: false,
          statusCode: 502,
          message:
            "Authentication service returned an invalid refresh response",
          errors: [],
        },
        {
          status: 502,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Replace access-token cookie
    |--------------------------------------------------------------------------
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
    | Replace rotated refresh-token cookie
    |--------------------------------------------------------------------------
    */

    cookieStore.set("devpulse_refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    /*
    |--------------------------------------------------------------------------
    | Do not expose tokens to browser JavaScript
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success: true,
      data: {
        user,
      },
      message: data.message || "Session refreshed successfully",
    });
  } catch {
    /*
    |--------------------------------------------------------------------------
    | Backend unavailable / network failure
    |--------------------------------------------------------------------------
    |
    | We cannot safely assume the session is renewable.
    |
    */

    cookieStore.delete("devpulse_token");

    cookieStore.delete("devpulse_refresh_token");

    return NextResponse.json(
      {
        success: false,
        statusCode: 503,
        message: "Authentication service is unavailable",
        errors: [],
      },
      {
        status: 503,
      },
    );
  }
}
