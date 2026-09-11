'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, ApiError } from '@/lib/api';
import { MeshGradientBackground } from '@/components/MeshGradientBackground';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setAuthUser, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setInfoMessage('Account created successfully! Please sign in with your new credentials.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors([]);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // Calls Next.js BFF login route handler (/api/auth/login) which sets httpOnly cookie
      // Fallbacks to direct backend POST /auth/login if BFF route is not yet established
      const response = await apiClient<{
        accessToken?: string;
        user: { id: string; name: string; email: string; role: string };
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      }).catch(async (bffErr) => {
        // If BFF route is not yet set up (Step 9 before Step 10), call backend directly
        if (bffErr instanceof ApiError && bffErr.statusCode === 404) {
          return apiClient<{
            accessToken: string;
            user: { id: string; name: string; email: string; role: string };
          }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password,
            }),
          });
        }
        throw bffErr;
      });

      if (response.success) {
        if (response.data?.user) {
          setAuthUser(response.data.user);
        }
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        if (err.errors && err.errors.length > 0) {
          setFieldErrors(err.errors);
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to connect to backend server. Please verify backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MeshGradientBackground
      colors={['#4f46e5', '#7c3aed', '#0284c7', '#059669']}
      speed={14}
      blur={130}
      interactive
    >
      <div className="flex items-center justify-center min-h-screen px-6 py-12 lg:px-16 font-sans">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Brand, Motto & Community Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-7 text-left"
          >
            {/* Logo */}
            <Link href="/" className="inline-flex items-center space-x-3.5 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-[0_0_24px_rgba(99,102,241,0.4)] transition-transform group-hover:scale-105">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#080a10]">
                  <svg
                    className="h-5 w-5 text-indigo-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                DevPulse
              </span>
            </Link>

            {/* Motto */}
            <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white leading-[1.12]">
              Where code meets{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
                collective intelligence.
              </span>
            </h1>

            {/* Passage */}
            <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-md">
              A modern platform engineered for developers to exchange technical insights, debate architecture, and build the future of software together.
            </p>

            {/* Live Security Indicator */}
            <div className="inline-flex items-center space-x-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-zinc-300 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>JWT Authentication & Role-Based Authorization Active</span>
            </div>
          </motion.div>

          {/* Right Column: Sleek Glassmorphism Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 w-full max-w-md mx-auto"
          >
            <div className="relative rounded-3xl border border-white/10 bg-zinc-950/60 p-8 sm:p-10 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.56)]">
              {/* Card Ambient Glow Accent */}
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="space-y-2 mb-7 text-left">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Enter your credentials to access your developer portal
                </p>
              </div>

              {/* Alert Feedback Messages */}
              <AnimatePresence mode="wait">
                {infoMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 backdrop-blur-md flex items-center space-x-2 text-left"
                  >
                    <svg
                      className="h-4 w-4 text-emerald-400 shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{infoMessage}</span>
                  </motion.div>
                )}

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200 backdrop-blur-md text-left"
                  >
                    <div className="flex items-start space-x-2">
                      <svg
                        className="h-4 w-4 text-red-400 mt-0.5 shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="font-medium">{errorMessage}</p>
                        {fieldErrors.length > 0 && (
                          <ul className="mt-1 list-disc list-inside space-y-0.5 text-red-300/90">
                            {fieldErrors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@work-email.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all focus:border-indigo-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-10 text-sm text-white placeholder-zinc-500 transition-all focus:border-indigo-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_28px_rgba(99,102,241,0.6)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In to DevPulse</span>
                  )}
                </button>
              </form>

              {/* Signup Switch */}
              <div className="mt-6 text-center text-xs text-zinc-400">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MeshGradientBackground>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080a10]" />}>
      <LoginForm />
    </Suspense>
  );
}
