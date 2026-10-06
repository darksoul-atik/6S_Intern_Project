import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

// Helper to construct a pseudo JWT with desired exp
function makeJwt(expSecondsFromNow: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  const payload = btoa(JSON.stringify({ sub: "user-123", email: "test@devpulse.io", exp }));
  return `${header}.${payload}.signature`;
}

describe("Next.js Auth Middleware", () => {
  it("redirects unauthenticated users from protected /dashboard to /login", () => {
    const req = new NextRequest("http://localhost:3000/dashboard");
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login?redirect=%2Fdashboard");
  });

  it("redirects unauthenticated users from /posts/new to /login?redirect=/posts/new", () => {
    const req = new NextRequest("http://localhost:3000/posts/new");
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login?redirect=%2Fposts%2Fnew");
  });

  it("redirects unauthenticated users from /developers/456/edit to /login?redirect=/developers/456/edit", () => {
    const req = new NextRequest("http://localhost:3000/developers/456/edit");
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login?redirect=%2Fdevelopers%2F456%2Fedit");
  });

  it("allows access to protected routes when valid devpulse_token is present", () => {
    const validToken = makeJwt(3600);
    const req = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: `devpulse_token=${validToken}`,
      },
    });
    const res = middleware(req);

    // Passed through (NextResponse.next())
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows access to protected routes when access token is expired but refresh token is valid", () => {
    const expiredAccessToken = makeJwt(-300); // expired 5 mins ago
    const validRefreshToken = makeJwt(7 * 24 * 3600); // valid 7 days
    const req = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: `devpulse_token=${expiredAccessToken}; devpulse_refresh_token=${validRefreshToken}`,
      },
    });
    const res = middleware(req);

    // Middleware allows the request so the client interceptor can refresh the token seamlessly
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows public post routes through even without tokens", () => {
    const req = new NextRequest("http://localhost:3000/posts");
    const res = middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects authenticated users visiting /login to /dashboard", () => {
    const validToken = makeJwt(3600);
    const req = new NextRequest("http://localhost:3000/login", {
      headers: {
        cookie: `devpulse_token=${validToken}`,
      },
    });
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("clears dead cookies when visiting /login with expired tokens", () => {
    const expiredToken = makeJwt(-100);
    const req = new NextRequest("http://localhost:3000/login", {
      headers: {
        cookie: `devpulse_token=${expiredToken}`,
      },
    });
    const res = middleware(req);

    expect(res.status).toBe(200);
    // Deleted cookies have max-age 0 or empty expires
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("devpulse_token=");
  });
});
