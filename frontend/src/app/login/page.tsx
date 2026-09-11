'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogIn, FiEye, FiEyeOff, FiX, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { apiClient, ApiError } from '@/lib/api';
import { MeshGradientBackground } from '@/components/MeshGradientBackground';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setAuthUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [capsLockOn, setCapsLockOn] = useState<boolean>(false);

  const infoMessage = searchParams.get('registered') === 'true'
    ? 'Account created successfully! Please sign in with your new credentials.'
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setWarningMessage(null);
    setFieldErrors([]);

    if (!email.trim() || !email.includes('@')) {
      setWarningMessage('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }
    if (!password) {
      setWarningMessage('Please enter your password to continue.');
      return;
    }

    setIsLoading(true);

    try {
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

      if (response.success && response.data?.user) {
        setAuthUser(response.data.user);
        const redirectPath = searchParams.get('redirect') || '/dashboard';
        router.push(redirectPath);
      } else {
        setErrorMessage(response.message || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Invalid email or password.');
        if (err.errors && err.errors.length > 0) {
          setFieldErrors(err.errors);
        }
      } else {
        setErrorMessage('Network or server error. Please try again.');
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
      <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-12 py-8 sm:py-12 font-sans overflow-x-hidden">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Hero Identity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6 text-center lg:text-left"
          >
            {/* Brand Logo Link */}
            <Link
              href="/"
              className="inline-flex items-center space-x-3 group"
            >
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-[0_0_24px_rgba(99,102,241,0.4)] transition-transform group-hover:scale-105">
                <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#080a10]">
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
              <span className="text-2xl sm:text-3xl font-bold font-manrope tracking-tight text-white">
                DevPulse
              </span>
            </Link>

            {/* Motto */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-bold font-manrope tracking-tight text-white leading-[1.12]">
              Where code meets{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
                collective intelligence.
              </span>
            </h1>

            {/* Passage */}
            <p className="text-sm sm:text-base text-zinc-300 font-sans font-normal leading-relaxed max-w-md mx-auto lg:mx-0">
              A modern platform engineered for developers to exchange technical insights, debate architecture, and build the future of software together.
            </p>
          </motion.div>

          {/* Right Column: Sleek Glassmorphism Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 w-full max-w-md mx-auto"
          >
            <div className="relative rounded-3xl border border-white/10 bg-zinc-950/60 p-5 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.56)]">
              {/* Card Ambient Glow Accent */}
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="space-y-1.5 mb-6 text-left">
                <h2 className="text-xl sm:text-2xl font-bold font-manrope tracking-tight text-white">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 font-sans">
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
                    <FiCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{infoMessage}</span>
                  </motion.div>
                )}

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200 backdrop-blur-md text-left shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                  >
                    <div className="flex items-start space-x-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
                        <FiX className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="font-semibold text-red-300 font-manrope">Something went wrong</p>
                        <p className="mt-0.5">{errorMessage}</p>
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

                {warningMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 backdrop-blur-md text-left shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                  >
                    <div className="flex items-start space-x-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                        <FiAlertTriangle className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="font-semibold text-amber-300 font-manrope">Notice</p>
                        <p className="mt-0.5">{warningMessage}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 font-sans">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (warningMessage) setWarningMessage(null);
                    }}
                    placeholder="name@work-email.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all focus:border-indigo-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300 font-sans">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (warningMessage) setWarningMessage(null);
                      }}
                      onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                      onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-10 text-sm text-white placeholder-zinc-500 transition-all focus:border-indigo-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-4 w-4" />
                      ) : (
                        <FiEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {capsLockOn && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-amber-400 mt-1.5">
                      <FiAlertTriangle className="h-3.5 w-3.5" />
                      <span>Caps Lock is ON</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 py-3.5 text-xs sm:text-sm font-semibold font-manrope text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_28px_rgba(99,102,241,0.6)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <FiLogIn className="h-4 w-4" />
                      <span>Sign In to DevPulse</span>
                    </>
                  )}
                </button>
              </form>

              {/* Signup Switch */}
              <div className="mt-6 text-center text-xs text-zinc-400 font-sans">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold font-manrope text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
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
