import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function handleProxy(
  req: NextRequest,
  paramsPromise: Promise<{ path?: string[] }>,
  method: string,
) {
  try {
    const { path = [] } = await paramsPromise;

    const cookieStore = await cookies();
    const token = cookieStore.get("devpulse_token")?.value;

    const targetPath = path.join("/");

    const backendUrl =
      `${API_BASE_URL}/users` +
      (targetPath ? `/${targetPath}` : "") +
      req.nextUrl.search;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let body: string | undefined;

    if (["POST", "PATCH", "PUT"].includes(method)) {
      try {
        const jsonBody = await req.json();
        body = JSON.stringify(jsonBody);
      } catch {
        // Request may not have a body
      }
    }

    const backendRes = await fetch(backendUrl, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: backendRes.status,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        message: `BFF Users Proxy Error: ${message}`,
        errors: [],
      },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return handleProxy(req, params, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return handleProxy(req, params, "POST");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return handleProxy(req, params, "PATCH");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return handleProxy(req, params, "DELETE");
}
