'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogIn, FiEye, FiEyeOff, FiX, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { useLoginMutation, extractAuthErrorMessage } from '@/hooks/useAuthMutations';
import { MeshGradientBackground } from '@/components/MeshGradientBackground';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
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
            <div className="relative rounded-3xl border border-white/10 bg-zinc-950/60 p-4 min-[400px]:p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.56)]">
              {/* Card Ambient Glow Accent */}
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="space-y-1.5 mb-5 sm:mb-6 text-left">
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
              </AnimatePresence>

              {/* Login Form with RHF + Zod */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-xs font-medium text-zinc-300 font-sans">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'login-email-error' : undefined}
                    placeholder="name@work-email.com"
                    className={`w-full rounded-xl border px-3.5 sm:px-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder-zinc-500 transition-all font-sans focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-500/60 bg-red-500/[0.05] focus:border-red-500 focus:ring-red-500/20'
                        : 'border-white/10 bg-white/[0.04] focus:border-indigo-500 focus:bg-white/[0.07] focus:ring-indigo-500/20'
                    }`}
                  />
                  {errors.email && (
                    <p id="login-email-error" className="text-xs text-red-400 mt-1 flex items-center space-x-1 font-sans">
                      <FiAlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{errors.email.message}</span>
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="text-xs font-medium text-zinc-300 font-sans">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      {...register('password')}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'login-password-error' : undefined}
                      onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                      onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                      placeholder="••••••••••••"
                      className={`w-full rounded-xl border pl-3.5 sm:pl-4 pr-11 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder-zinc-500 transition-all font-sans focus:outline-none focus:ring-2 ${
                        errors.password
                          ? 'border-red-500/60 bg-red-500/[0.05] focus:border-red-500 focus:ring-red-500/20'
                          : 'border-white/10 bg-white/[0.04] focus:border-indigo-500 focus:bg-white/[0.07] focus:ring-indigo-500/20'
                      }`}
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
                  {errors.password && (
                    <p id="login-password-error" className="text-xs text-red-400 mt-1 flex items-center space-x-1 font-sans">
                      <FiAlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{errors.password.message}</span>
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isPending}
                  aria-disabled={isPending}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 py-3.5 text-xs sm:text-sm font-semibold font-manrope text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_28px_rgba(99,102,241,0.6)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
                >
                  {isPending ? (
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
