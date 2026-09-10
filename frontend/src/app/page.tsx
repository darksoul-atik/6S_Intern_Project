'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api';
import { MeshGradientBackground } from '@/components/MeshGradientBackground';

interface HealthData {
  status: string;
  db: 'connected' | 'disconnected';
}

export default function Home() {
  // Silent health telemetry (Preserves Day 1 contract under the hood)
  useEffect(() => {
    apiClient<HealthData>('/health')
      .then((res) => {
        if (res.success && res.data) {
          console.log('[DevPulse System] Live Health Check: OK, DB:', res.data.db);
        }
      })
      .catch((err) => {
        console.warn('[DevPulse System] Health Check Offline:', err);
      });
  }, []);

  // Auth UI state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>('alex.chen@devpulse.io');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToast(
      authMode === 'signin'
        ? 'Interface preview: Authentication engine activates on Day 2.'
        : 'Interface preview: User registration arrives on Day 2.'
    );
    setTimeout(() => setToast(null), 4000);
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
          
          {/* Left Column: Brand, Motto & Passage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-7 text-left"
          >
            {/* Logo */}
            <div className="flex items-center space-x-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-[0_0_24px_rgba(99,102,241,0.4)]">
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
              <span className="text-2xl font-bold tracking-tight text-white font-sans">
                DevPulse
              </span>
            </div>

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
          </motion.div>

          {/* Right Column: Professional Glassmorphism Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6"
          >
            <div className="relative w-full max-w-md mx-auto rounded-3xl border border-white/[0.08] bg-[#080a12]/70 p-8 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.85)] backdrop-blur-3xl transition-all">
              
              {/* Subtle Ambient Border Highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

              {/* Toast Notification */}
              {toast && (
                <div className="mb-5 rounded-xl border border-indigo-500/30 bg-indigo-950/60 p-3 text-xs text-indigo-200 backdrop-blur-md">
                  {toast}
                </div>
              )}

              {/* Header */}
              <div className="mb-6 text-left">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  {authMode === 'signin' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="text-xs text-zinc-400 mt-1 font-normal">
                  {authMode === 'signin'
                    ? 'Enter your details to access your account'
                    : 'Start collaborating with top developers worldwide'}
                </p>
              </div>

              {/* Segmented Control Tab Switcher */}
              <div className="flex rounded-xl bg-zinc-900/70 p-1 border border-white/[0.06] mb-6">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all duration-200 cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.06]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all duration-200 cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.06]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {/* Email Input */}
                <div>
                  <label className="block text-[12px] font-medium text-zinc-300 mb-1.5">
                    Email address
                  </label>
                  <div className="relative rounded-xl border border-white/[0.08] bg-zinc-900/50 hover:border-white/[0.14] focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@domain.com"
                      className="w-full bg-transparent px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none font-normal"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-medium text-zinc-300">
                      Password
                    </label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setToast('Password recovery engine activates on Day 2.')}
                        className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative rounded-xl border border-white/[0.08] bg-zinc-900/50 hover:border-white/[0.14] focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter password"
                      className="w-full bg-transparent px-3.5 py-2.5 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none font-mono tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center pt-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-zinc-900 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[12px] text-zinc-400 font-normal">
                      Remember me on this device
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-400 hover:via-indigo-500 hover:to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 active:scale-[0.99] cursor-pointer"
                >
                  {authMode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              {/* Social Login Divider */}
              <div className="mt-6">
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-white/[0.08]" />
                  <span className="bg-[#080a12] px-3 text-[11px] font-medium text-zinc-500">
                    Or continue with
                  </span>
                </div>

                {/* Social Login Buttons */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setToast('GitHub OAuth activates on Day 2.')}
                    className="flex items-center justify-center space-x-2 rounded-xl border border-white/[0.08] bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-white/[0.16] py-2.5 text-xs font-medium text-zinc-300 transition-all duration-200 cursor-pointer"
                  >
                    <svg className="h-4 w-4 fill-current text-white" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>GitHub</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setToast('Google OAuth activates on Day 2.')}
                    className="flex items-center justify-center space-x-2 rounded-xl border border-white/[0.08] bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-white/[0.16] py-2.5 text-xs font-medium text-zinc-300 transition-all duration-200 cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </MeshGradientBackground>
  );
}
