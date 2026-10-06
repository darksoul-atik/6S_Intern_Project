import type { HTMLAttributes, ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const mockPush = vi.fn();
const mockMutateAsync = vi.fn();
const mockSetAuthUser = vi.fn();

let mockIsPending = false;
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),

  useSearchParams: () => mockSearchParams,
}));

vi.mock("../mutations/auth-mutations", () => ({
  useLoginMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    login: mockSetAuthUser,
  }),
}));

vi.mock("@/components/ui/mesh-gradient-background", () => ({
  MeshGradientBackground: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },

  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockIsPending = false;
    mockSearchParams = new URLSearchParams();
  });

  it("shows validation errors and does not call the API for invalid input", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email address/i), "invalid-email");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/please enter a valid email/i),
    ).toBeInTheDocument();

    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockSetAuthUser).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables the form and shows the pending state while login is pending", () => {
    mockIsPending = true;

    render(<LoginForm />);

    expect(screen.getByLabelText(/email address/i)).toBeDisabled();

    expect(screen.getByLabelText(/^password$/i)).toBeDisabled();

    expect(
      screen.getByRole("button", { name: /authenticating/i }),
    ).toBeDisabled();

    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
  });

  it("logs in successfully and redirects after authentication", async () => {
    const user = userEvent.setup();

    const authenticatedUser = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      role: "user",
    };

    mockMutateAsync.mockResolvedValueOnce({
      success: true,
      message: "Login successful",
      data: {
        accessToken: "test-access-token",
        user: authenticatedUser,
      },
    });

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );

    await user.type(screen.getByLabelText(/^password$/i), "secret123");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "secret123",
      });
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockSetAuthUser).toHaveBeenCalledWith(authenticatedUser);
    });

    expect(mockSetAuthUser).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });

  it("redirects to the redirect query parameter after successful login", async () => {
    const user = userEvent.setup();

    mockSearchParams = new URLSearchParams("redirect=/posts/create");

    const authenticatedUser = {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      role: "user",
    };

    mockMutateAsync.mockResolvedValueOnce({
      success: true,
      message: "Login successful",
      data: {
        accessToken: "test-access-token",
        user: authenticatedUser,
      },
    });

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );

    await user.type(screen.getByLabelText(/^password$/i), "secret123");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/posts/create");
    });

    expect(mockSetAuthUser).toHaveBeenCalledWith(authenticatedUser);
  });

  it("shows an API error and does not authenticate or redirect", async () => {
    const user = userEvent.setup();

    mockMutateAsync.mockRejectedValueOnce(
      new Error("Invalid email or password"),
    );

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );

    await user.type(screen.getByLabelText(/^password$/i), "wrongpassword");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();

    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();

    expect(mockMutateAsync).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(mockSetAuthUser).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows the response message when authentication is unsuccessful", async () => {
    const user = userEvent.setup();

    mockMutateAsync.mockResolvedValueOnce({
      success: false,
      message: "Authentication failed",
      data: null,
    });

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );

    await user.type(screen.getByLabelText(/^password$/i), "secret123");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/authentication failed/i),
    ).toBeInTheDocument();

    expect(mockSetAuthUser).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows the registration success message when registered=true", () => {
    mockSearchParams = new URLSearchParams("registered=true");

    render(<LoginForm />);

    expect(
      screen.getByText(
        /account created successfully! please sign in with your new credentials/i,
      ),
    ).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", {
        name: /show password/i,
      }),
    );

    expect(passwordInput).toHaveAttribute("type", "text");

    expect(
      screen.getByRole("button", {
        name: /hide password/i,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /hide password/i,
      }),
    );

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("prevents submission when the login mutation is already pending", async () => {
    const user = userEvent.setup();

    mockIsPending = true;

    render(<LoginForm />);

    const submitButton = screen.getByRole("button", {
      name: /authenticating/i,
    });

    expect(submitButton).toBeDisabled();

    await user.click(submitButton);

    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockSetAuthUser).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("safely redirects to /dashboard when redirect param contains external or recursive urls", async () => {
    const user = userEvent.setup();

    mockSearchParams = new URLSearchParams("redirect=https://attacker.com/phish");

    mockMutateAsync.mockResolvedValueOnce({
      success: true,
      message: "Login successful",
      data: {
        accessToken: "test-token",
        user: { id: "1", name: "User", email: "user@test.com", role: "user" },
      },
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email address/i), "user@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
