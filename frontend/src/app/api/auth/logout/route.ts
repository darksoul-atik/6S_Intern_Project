import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST() {
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get("devpulse_refresh_token")?.value;

  try {
    /*
    |--------------------------------------------------------------------------
    | Revoke refresh token on backend
    |--------------------------------------------------------------------------
    |
    | If a refresh token exists, tell NestJS to clear the stored
    | refreshTokenHash for this user.
    |
    | Logout stays safe even if this backend call fails.
    |
    */

    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });
    }
  } catch {
    /*
    |--------------------------------------------------------------------------
    | Ignore backend logout failure
    |--------------------------------------------------------------------------
    |
    | We still clear the local httpOnly cookies below.
    |
    | This keeps logout predictable even if:
    | - refresh token is already expired
    | - backend is temporarily unavailable
    | - token was already revoked
    |
    */
  }

  /*
  |--------------------------------------------------------------------------
  | Always clear both auth cookies
  |--------------------------------------------------------------------------
  */

  cookieStore.delete("devpulse_token");

  cookieStore.delete("devpulse_refresh_token");

  return NextResponse.json({
    success: true,
    data: null,
    message: "Logged out successfully",
  });
}
