'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUserPlus, FiEye, FiEyeOff, FiX, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { useSignupMutation, extractAuthErrorMessage } from '@/hooks/useAuthMutations';
import { MeshGradientBackground } from '@/components/MeshGradientBackground';

export default function SignupPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [capsLockOn, setCapsLockOn] = useState<boolean>(false);

  const signupMutation = useSignupMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignupInput) => {
    setErrorMessage(null);
    setFieldErrors([]);
    setSuccessMessage(null);

    try {
      const response = await signupMutation.mutateAsync(data);

      if (response.success) {
        setSuccessMessage(
          response.message || 'Account created successfully! Redirecting to login...'
        );
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 1800);
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
            <h1 className="text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl font-bold font-manrope tracking-tight text-white leading-[1.14]">
              Join the frontier of{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
                modern engineering.
              </span>
            </h1>

            {/* Passage */}
            <p className="text-xs min-[400px]:text-sm sm:text-base text-zinc-300 font-sans font-normal leading-relaxed max-w-md mx-auto lg:mx-0">
              Create your developer account to publish technical insights, discuss architectural decisions, and collaborate with world-class engineers.
            </p>
          </motion.div>

          {/* Right Column: Sleek Glassmorphism Signup Card */}
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
                  Create an account
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 font-sans">
                  Enter your details below to register your DevPulse identity
                </p>
              </div>

              {/* Alert Feedback Messages */}
              <AnimatePresence mode="wait">
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

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 backdrop-blur-md flex items-center space-x-2 text-left shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      <FiCheck className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="font-semibold text-emerald-300 font-manrope">Success</p>
                      <p className="mt-0.5">{successMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Registration Form with RHF */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left" noValidate>
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="signup-name" className="text-xs font-medium text-zinc-300 font-sans">
                    Full Name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'signup-name-error' : undefined}
                    placeholder="e.g. Alex Chen"
                    className={`w-full rounded-xl border px-3.5 sm:px-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder-zinc-500 transition-all font-sans focus:outline-none focus:ring-2 ${
                      errors.name
                        ? 'border-red-500/60 bg-red-500/[0.05] focus:border-red-500 focus:ring-red-500/20'
                        : 'border-white/10 bg-white/[0.04] focus:border-indigo-500 focus:bg-white/[0.07] focus:ring-indigo-500/20'
                    }`}
                  />
                  {errors.name && (
                    <p id="signup-name-error" className="text-xs text-red-400 mt-1 flex items-center space-x-1 font-sans">
                      <FiAlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{errors.name.message}</span>
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="signup-email" className="text-xs font-medium text-zinc-300 font-sans">
                    Email Address
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'signup-email-error' : undefined}
                    placeholder="name@work-email.com"
                    className={`w-full rounded-xl border px-3.5 sm:px-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder-zinc-500 transition-all font-sans focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-500/60 bg-red-500/[0.05] focus:border-red-500 focus:ring-red-500/20'
                        : 'border-white/10 bg-white/[0.04] focus:border-indigo-500 focus:bg-white/[0.07] focus:ring-indigo-500/20'
                    }`}
                  />
                  {errors.email && (
                    <p id="signup-email-error" className="text-xs text-red-400 mt-1 flex items-center space-x-1 font-sans">
                      <FiAlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{errors.email.message}</span>
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="signup-password" className="text-xs font-medium text-zinc-300 font-sans">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('password')}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'signup-password-error' : undefined}
                      onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                      onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                      placeholder="Minimum 6 characters"
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
                  {errors.password ? (
                    <p id="signup-password-error" className="text-xs text-red-400 mt-1 flex items-center space-x-1 font-sans">
                      <FiAlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{errors.password.message}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500 font-sans">
                      Must be at least 6 characters. Never stored in plain text.
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={isSubmitting || signupMutation.isPending}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 py-3.5 text-xs sm:text-sm font-semibold font-manrope text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_28px_rgba(99,102,241,0.6)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                >
                  {isSubmitting || signupMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <FiUserPlus className="h-4 w-4" />
                      <span>Register Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* Login Switch */}
              <div className="mt-6 text-center text-xs text-zinc-400 font-sans">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold font-manrope text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MeshGradientBackground>
  );
}
