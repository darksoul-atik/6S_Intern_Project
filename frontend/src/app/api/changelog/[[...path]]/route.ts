import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const PROXY_TIMEOUT_MS = 10_000;

async function proxyChangelogRequest(
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
      `${API_BASE_URL}/changelog` +
      (pathPart ? `/${pathPart}` : "") +
      request.nextUrl.search;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let body: string | undefined;

    if (method === "POST") {
      try {
        body = JSON.stringify(await request.json());
      } catch {
        body = undefined;
      }
    }

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort(new Error("BFF proxy timeout"));
    }, PROXY_TIMEOUT_MS);

    // If caller aborted early, propagate
    if (request.signal) {
      request.signal.addEventListener("abort", () => {
        timeoutController.abort(request.signal.reason);
      });
    }

    try {
      const backendResponse = await fetch(backendUrl, {
        method,
        headers,
        body,
        cache: "no-store",
        signal: timeoutController.signal,
      });

      const data = await backendResponse.json().catch(() => ({}));

      return NextResponse.json(data, {
        status: backendResponse.status,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: unknown) {
    console.error("Changelog BFF proxy error:", error);

    const isTimeout =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("timeout"));

    return NextResponse.json(
      {
        success: false,
        statusCode: isTimeout ? 504 : 500,
        code: isTimeout ? "UPSTREAM_TIMEOUT" : "INTERNAL_SERVER_ERROR",
        message: isTimeout
          ? "Changelog proxy request timed out"
          : "Failed to communicate with backend changelog service",
        errors: [],
      },
      {
        status: isTimeout ? 504 : 500,
      },
    );
  }
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      path?: string[];
    }>;
  },
) {
  return proxyChangelogRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      path?: string[];
    }>;
  },
) {
  return proxyChangelogRequest(request, params, "POST");
}
