import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./auth-schema";

describe("signupSchema", () => {
  it("accepts valid signup data and normalizes email", () => {
    const result = signupSchema.safeParse({
      name: "Test User",
      email: "TEST@EXAMPLE.COM",
      password: "secret123",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects an invalid email", () => {
    const result = signupSchema.safeParse({
      name: "Test User",
      email: "not-an-email",
      password: "secret123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = signupSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "12345",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a password that does not contain 6 non-whitespace characters", () => {
    const result = signupSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "12345 ",
    });

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "secret123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "wrong-email",
      password: "secret123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});
