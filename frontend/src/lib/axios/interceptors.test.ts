import axios, { type AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSessionExpiredHandler,
  setupInterceptors,
} from "./interceptors";

vi.mock("@/lib/auth/session", () => ({
  requestSessionLogout: vi.fn().mockResolvedValue(undefined),
}));

describe("Axios Interceptors", () => {
  let instance: AxiosInstance;
  const mockSessionExpired = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setSessionExpiredHandler(mockSessionExpired);
    instance = axios.create();
    setupInterceptors(instance);

    // Mock window location
    Object.defineProperty(window, "location", {
      writable: true,
      configurable: true,
      value: {
        pathname: "/",
        replace: vi.fn(),
      },
    });
  });

  it("does not attempt refresh or redirect when /auth/login returns 401", async () => {
    const postSpy = vi.spyOn(axios, "post");

    // Mock instance call to reject with 401
    instance.defaults.adapter = async (config) => {
      if (config.url?.includes("/auth/login")) {
        const error = new Error("Request failed with status code 401") as unknown as {
          response: { status: number; data: { message: string } };
          config: typeof config;
          isAxiosError: boolean;
        };
        error.response = { status: 401, data: { message: "Invalid email or password" } };
        error.config = config;
        error.isAxiosError = true;
        return Promise.reject(error);
      }
      return Promise.resolve({ data: {}, status: 200, statusText: "OK", headers: {}, config });
    };

    await expect(
      instance.post("/auth/login", { email: "test@example.com", password: "wrong" }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password",
    });

    // Refresh should not have been called
    expect(postSpy).not.toHaveBeenCalledWith(
      "/api/auth/refresh",
      undefined,
      expect.anything(),
    );
    expect(mockSessionExpired).not.toHaveBeenCalled();
  });

  it("does not redirect when /auth/me returns 401 on home page / and refresh fails", async () => {
    window.location.pathname = "/";

    // Refresh will fail with 401 (guest with no refresh cookie)
    vi.spyOn(axios, "post").mockRejectedValue(new Error("Refresh token missing"));

    instance.defaults.adapter = async (config) => {
      const error = new Error("Request failed with status code 401") as unknown as {
        response: { status: number; data: { message: string } };
        config: typeof config;
        isAxiosError: boolean;
      };
      error.response = { status: 401, data: { message: "Unauthorized" } };
      error.config = config;
      error.isAxiosError = true;
      return Promise.reject(error);
    };

    await expect(instance.get("/auth/me")).rejects.toBeDefined();

    // Session expired handler should NOT have been called on public route
    expect(mockSessionExpired).not.toHaveBeenCalled();
  });

  it("redirects to session-expired when a request fails on a protected route and refresh fails", async () => {
    window.location.pathname = "/dashboard";

    vi.spyOn(axios, "post").mockRejectedValue(new Error("Refresh token expired"));

    instance.defaults.adapter = async (config) => {
      const error = new Error("Request failed with status code 401") as unknown as {
        response: { status: number; data: { message: string } };
        config: typeof config;
        isAxiosError: boolean;
      };
      error.response = { status: 401, data: { message: "Unauthorized" } };
      error.config = config;
      error.isAxiosError = true;
      return Promise.reject(error);
    };

    await expect(instance.get("/users/me/profile")).rejects.toBeDefined();

    expect(mockSessionExpired).toHaveBeenCalledWith("/login?reason=session-expired");
  });

  it("coalesces simultaneous 401 failures so redirect and logout are called once", async () => {
    window.location.pathname = "/dashboard";

    vi.spyOn(axios, "post").mockRejectedValue(new Error("Refresh token revoked"));

    instance.defaults.adapter = async (config) => {
      const error = new Error("Request failed with status code 401") as unknown as {
        response: { status: number; data: { message: string } };
        config: typeof config;
        isAxiosError: boolean;
      };
      error.response = { status: 401, data: { message: "Unauthorized" } };
      error.config = config;
      error.isAxiosError = true;
      return Promise.reject(error);
    };

    // Fire 3 simultaneous requests
    const results = await Promise.allSettled([
      instance.get("/posts"),
      instance.get("/users/me"),
      instance.get("/notifications"),
    ]);

    expect(results.every((r) => r.status === "rejected")).toBe(true);
    // Even though 3 failed simultaneously, sessionExpiredHandler called only once
    expect(mockSessionExpired).toHaveBeenCalledTimes(1);
    expect(mockSessionExpired).toHaveBeenCalledWith("/login?reason=session-expired");
  });
});
