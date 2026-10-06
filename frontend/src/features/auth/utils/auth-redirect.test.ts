import { describe, expect, it } from "vitest";
import { getSafeRedirectUrl } from "./auth-redirect";

describe("getSafeRedirectUrl", () => {
  it("defaults to /dashboard for null, undefined, or empty strings", () => {
    expect(getSafeRedirectUrl(null)).toBe("/dashboard");
    expect(getSafeRedirectUrl(undefined)).toBe("/dashboard");
    expect(getSafeRedirectUrl("")).toBe("/dashboard");
    expect(getSafeRedirectUrl("   ")).toBe("/dashboard");
  });

  it("blocks open redirect and protocol-relative attacks", () => {
    expect(getSafeRedirectUrl("https://evil.com")).toBe("/dashboard");
    expect(getSafeRedirectUrl("http://evil.com/phishing")).toBe("/dashboard");
    expect(getSafeRedirectUrl("//evil.com")).toBe("/dashboard");
    expect(getSafeRedirectUrl("/\\evil.com")).toBe("/dashboard");
    expect(getSafeRedirectUrl("javascript:alert(1)")).toBe("/dashboard");
  });

  it("prevents redirect loops back to auth pages", () => {
    expect(getSafeRedirectUrl("/login")).toBe("/dashboard");
    expect(getSafeRedirectUrl("/login?reason=session-expired")).toBe("/dashboard");
    expect(getSafeRedirectUrl("/signup")).toBe("/dashboard");
    expect(getSafeRedirectUrl("/signup?registered=true")).toBe("/dashboard");
    expect(getSafeRedirectUrl("/auth/login")).toBe("/dashboard");
  });

  it("permits safe application relative paths", () => {
    expect(getSafeRedirectUrl("/posts/new")).toBe("/posts/new");
    expect(getSafeRedirectUrl("/posts/123")).toBe("/posts/123");
    expect(getSafeRedirectUrl("/profile/edit?tab=skills")).toBe(
      "/profile/edit?tab=skills",
    );
    expect(getSafeRedirectUrl("/developers/456")).toBe("/developers/456");
  });
});
