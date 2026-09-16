'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogIn, FiEye, FiEyeOff, FiX, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { loginSchema, type LoginInput } from './auth.schemas';
import { useLoginMutation, extractAuthErrorMessage } from './auth.api';
import { MeshGradientBackground } from '@/components/MeshGradientBackground';
import { useAuth } from '@/context/AuthContext';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setAuthUser } = useAuth();
  const loginMutation = useLoginMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [capsLockOn, setCapsLockOn] = useState<boolean>(false);

  const infoMessage = searchParams.get('registered') === 'true'
    ? 'Account created successfully! Please sign in with your new credentials.'
    : null;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const isPending = isSubmitting || loginMutation.isPending;

  const onSubmit = async (data: LoginInput) => {
    if (isPending) return;
    setErrorMessage(null);
    setFieldErrors([]);

    try {
      const response = await loginMutation.mutateAsync(data);

      if (response.success && response.data?.user) {
        setAuthUser(response.data.user);
        const redirectPath = searchParams.get('redirect') || '/dashboard';
        router.push(redirectPath);
      } else {
        setErrorMessage(response.message || 'Authentication failed. Please try again.');
      }
    } catch (err: unknown) {
      const extracted = extractAuthErrorMessage(err);
      setErrorMessage(extracted.message);
      setFieldErrors(extracted.errors);

      // Map backend validation errors back to specific form fields
      extracted.errors.forEach((e) => {
        const lower = e.toLowerCase();
        if (lower.includes('email')) {
          setError('email', { type: 'server', message: e });
        } else if (lower.includes('password')) {
          setError('password', { type: 'server', message: e });
        }
      });
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
              className="inline-flex items-center group focus:outline-hidden"
              aria-label="DevPulse Home"
            >
              <Image
                src="/images/logo.png"
                alt="DevPulse Logo"
                width={628}
                height={281}
                priority
                className="h-9 sm:h-11 md:h-12 w-auto object-contain drop-shadow-[0_0_20px_rgba(251,191,36,0.25)] transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            {/* Motto */}
            <h1 className="text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl font-bold font-manrope tracking-tight text-white leading-[1.14]">
              Welcome back to your{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
                developer hub.
              </span>
            </h1>

            {/* Passage */}
            <p className="text-xs min-[400px]:text-sm sm:text-base text-zinc-300 font-sans font-normal leading-relaxed max-w-md mx-auto lg:mx-0">
              Sign in to manage your engineering sessions, verify system permissions, and engage with the DevPulse architecture community.
            </p>
          </motion.div>

          {/* Right Column: Sleek Glassmorphism Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 w-full max-w-md mx-auto"
          >
            <div className="relative rounded-3xl border border-white/15 bg-zinc-950/70 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-2xl">
              
              {/* Header */}
              <div className="mb-6 sm:mb-8 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold font-manrope tracking-tight text-white">
                  Sign In
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 font-sans mt-1">
                  Access your developer account and workspace
                </p>
              </div>

              {/* Registration Success Banner */}
              <AnimatePresence>
                {infoMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="flex items-start space-x-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-sans text-emerald-200">
                      <FiCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{infoMessage}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Global Error Banner */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="flex items-start space-x-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-sans text-rose-200"
                    >
                      <FiAlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold font-manrope">{errorMessage}</p>
                        {fieldErrors.length > 0 && (
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-rose-300">
                            {fieldErrors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="text-rose-400 hover:text-rose-200 transition-colors"
                        aria-label="Dismiss error"
                      >
                        <FiX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5" noValidate>
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold font-manrope uppercase tracking-wider text-zinc-300 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    disabled={isPending}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'login-email-error' : undefined}
                    placeholder="alex.chen@example.com"
                    {...register('email')}
                    className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 backdrop-blur-md transition-all focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors.email && (
                    <p id="login-email-error" className="mt-1.5 text-xs text-rose-400 font-sans">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold font-manrope uppercase tracking-wider text-zinc-300"
                    >
                      Password
                    </label>
                    {capsLockOn && (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-sans text-amber-300">
                        <FiAlertTriangle className="h-3 w-3" />
                        <span>Caps Lock is ON</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      disabled={isPending}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'login-password-error' : undefined}
                      placeholder="••••••••"
                      onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                      onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                      {...register('password')}
                      className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 backdrop-blur-md transition-all focus:outline-none focus:ring-2 pr-11 ${
                        errors.password
                          ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-4 w-4" />
                      ) : (
                        <FiEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="login-password-error" className="mt-1.5 text-xs text-rose-400 font-sans">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={isPending}
                  aria-disabled={isPending}
                  className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 p-px font-semibold font-manrope text-white shadow-xl shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  <div className="relative flex items-center justify-center space-x-2 rounded-2xl bg-zinc-950/40 px-6 py-3.5 backdrop-blur-xl transition-all group-hover:bg-transparent">
                    {isPending ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="text-sm font-semibold font-manrope">Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-semibold font-manrope">Sign In</span>
                        <FiLogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </div>
                </button>
              </form>

              {/* Card Footer: Switch to Signup */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-zinc-400 font-sans">
                Don&apos;t have an account yet?{' '}
                <Link
                  href="/signup"
                  className="font-semibold font-manrope text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
                >
                  Create account
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MeshGradientBackground>
  );
}
