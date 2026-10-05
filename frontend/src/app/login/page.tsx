import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;

  const sessionExpired = params?.reason === "session-expired";

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080a10]" />}>
      <div className="min-h-screen bg-[#080a10]">
        {sessionExpired && (
          <div className="mx-auto max-w-md px-4 pt-6">
            <div
              role="alert"
              className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
            >
              Your session has expired. Please sign in again.
            </div>
          </div>
        )}

        <LoginForm />
      </div>
    </Suspense>
  );
}
