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
  // Live health telemetry (Day 1 contract)
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [dbStatus, setDbStatus] = useState<string>('checking');

  // Form states
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>('developer@devpulse.io');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const response = await apiClient<HealthData>('/health');
      if (response.success && response.data) {
        setApiConnected(true);
        setDbStatus(response.data.db);
      } else {
        setApiConnected(false);
        setDbStatus('disconnected');
      }
    } catch {
      setApiConnected(false);
      setDbStatus('disconnected');
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(
      authMode === 'signin'
        ? 'Interface preview: Live session authorization arrives on Day 2.'
        : 'Interface preview: Registration engine activates on Day 2.'
    );
    setTimeout(() => setToastMessage(null), 4500);
  };

  return (
    <MeshGradientBackground
      colors={['#4f46e5', '#8b5cf6', '#06b6d4', '#10b981']}
      speed={12}
      blur={120}
      interactive
    >
      <div className="flex items-center justify-center min-h-screen px-6 py-10 lg:px-16">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Column: Brand, Motto & Passage */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            {/* Custom DevPulse Logo */}
            <div className="flex items-center space-x-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-emerald-400 shadow-[0_0_28px_rgba(99,102,241,0.5)]">
                <svg
                  className="h-6 w-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <span className="text-3xl font-extrabold tracking-tight text-white font-sans">
                DevPulse
              </span>
            </div>

            {/* Motto */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Where Code Meets{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300">
                Community.
              </span>
            </h1>

            {/* Passage */}
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-md font-normal">
              A collaborative space for developers to exchange technical insights,
              share discoveries, and build software at the speed of thought.
            </p>

            {/* Discreet Live Diagnostics Pill */}
            <div className="pt-2 flex items-center space-x-3">
              <div className="inline-flex items-center space-x-2 rounded-full bg-black/40 border border-white/10 px-3.5 py-1.5 backdrop-blur-xl">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      healthLoading
                        ? 'bg-amber-400 animate-ping'
                        : apiConnected
                        ? 'bg-emerald-400 animate-ping'
                        : 'bg-rose-400 animate-ping'
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      healthLoading
                        ? 'bg-amber-400'
                        : apiConnected
                        ? 'bg-emerald-400'
                        : 'bg-rose-500'
                    }`}
                  />
                </span>
                <span className="text-xs text-zinc-300 font-medium">
                  {healthLoading
                    ? 'Checking...'
                    : apiConnected
                    ? `API Online • DB ${dbStatus}`
                    : 'API Offline'}
                </span>
                <button
                  onClick={checkHealth}
                  disabled={healthLoading}
                  title="Check health"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  <svg
                    className={`h-3 w-3 ${healthLoading ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>

              <a
                href="http://localhost:5000/docs"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-4 decoration-white/20"
              >
                API Docs ↗
              </a>
            </div>
          </motion.div>

          {/* Right Column: Slick Login / Sign In Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-6"
          >
            <div className="relative w-full max-w-md mx-auto rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-2xl">
              
              {/* Notification Toast */}
              {toastMessage && (
                <div className="mb-4 rounded-xl border border-indigo-500/30 bg-indigo-950/80 p-3 text-xs text-indigo-200 backdrop-blur-md animate-in fade-in">
                  {toastMessage}
                </div>
              )}

              {/* Form Tab Switcher */}
              <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Login / Registration Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@domain.com"
                    className="w-full mt-1.5 rounded-xl border border-white/10 bg-black/40 py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-400 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-zinc-300">
                      Password
                    </label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setToastMessage('Password reset engine activates on Day 2.')}
                        className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1.5">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-zinc-500 focus:border-indigo-400 focus:outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
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

                <div className="flex items-center pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-700 bg-black text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs text-zinc-400">Remember for 30 days</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-white hover:bg-zinc-100 py-3 text-xs font-bold text-black transition-all active:scale-[0.99] cursor-pointer shadow-lg shadow-white/10"
                >
                  {authMode === 'signin' ? 'Sign In →' : 'Create Account →'}
                </button>
              </form>

              {/* Social Login Options */}
              <div className="mt-6">
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-white/10" />
                  <span className="bg-[#080910] px-3 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Or continue with
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setToastMessage('GitHub authentication activates on Day 2.')}
                    className="flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>GitHub</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setToastMessage('Google authentication activates on Day 2.')}
                    className="flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
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
