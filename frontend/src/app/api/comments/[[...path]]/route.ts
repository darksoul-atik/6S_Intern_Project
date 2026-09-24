import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function proxyCommentsRequest(
  request: NextRequest,
  paramsPromise: Promise<{ path?: string[] }>,
  method: string,
) {
  try {
    const { path = [] } = await paramsPromise;

    const cookieStore = await cookies();
    const token = cookieStore.get("devpulse_token")?.value;

    const pathPart = path.join("/");

    const backendUrl =
      `${API_BASE_URL}/comments` +
      (pathPart ? `/${pathPart}` : "") +
      request.nextUrl.search;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let body: string | undefined;

    if (method === "POST" || method === "PATCH" || method === "PUT") {
      try {
        body = JSON.stringify(await request.json());
      } catch {
        body = undefined;
      }
    }

    const backendResponse = await fetch(backendUrl, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const data = await backendResponse.json().catch(() => ({}));

    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error("Comments BFF proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        message: "Failed to communicate with backend",
        errors: [],
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      path?: string[];
    }>;
  },
) {
  return proxyCommentsRequest(request, params, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      path?: string[];
    }>;
  },
) {
  return proxyCommentsRequest(request, params, "DELETE");
}
