'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface HealthData {
  status: string;
  db: 'connected' | 'disconnected';
}

export default function Home() {
  // Live health diagnostic state (Preserves Day 1 contract)
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [dbStatus, setDbStatus] = useState<string>('checking');
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Login UI states (Presentation for Day 1 preview)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>('developer@devpulse.io');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showMockToast, setShowMockToast] = useState<boolean>(false);

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
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowMockToast(true);
    setTimeout(() => setShowMockToast(false), 5000);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07090e] text-slate-100 flex flex-col justify-between overflow-hidden selection:bg-indigo-500 selection:text-white font-sans">
      {/* Dynamic Animated Ambient Glowing Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Violet / Indigo Glow Orb */}
        <div className="animate-float-1 absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-800/25 blur-[120px] filter" />
        
        {/* Emerald / Cyan Glow Orb */}
        <div className="animate-float-2 absolute top-1/3 -right-24 h-[580px] w-[580px] rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/25 to-cyan-500/15 blur-[130px] filter" />
        
        {/* Fuchsia / Rose Glow Orb */}
        <div className="animate-float-3 absolute -bottom-40 left-1/4 h-[560px] w-[560px] rounded-full bg-gradient-to-r from-fuchsia-600/20 via-pink-600/15 to-indigo-600/25 blur-[140px] filter" />

        {/* Cyberpunk Grid Overlay with Vignette */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_80%)]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-12 backdrop-blur-md border-b border-slate-800/40">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <span className="text-xl font-black text-white">⚡</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">DevPulse</span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                Day 1
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Developer Ecosystem</p>
          </div>
        </div>

        {/* Live Health Check Status Pill */}
        <div className="flex items-center space-x-3">
          <div
            title={`Backend: http://localhost:5000 | Last checked: ${lastChecked || 'just now'}`}
            className="flex items-center space-x-2.5 rounded-full bg-slate-900/80 px-3.5 py-1.5 border border-slate-700/60 backdrop-blur-xl shadow-lg transition-all hover:border-slate-600"
          >
            <span className="relative flex h-2.5 w-2.5">
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
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  healthLoading
                    ? 'bg-amber-400'
                    : apiConnected
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                    : 'bg-rose-500'
                }`}
              />
            </span>
            <span className="text-xs font-medium text-slate-300">
              {healthLoading ? (
                'Probing System...'
              ) : apiConnected ? (
                <>
                  API Online • <span className="text-emerald-400">DB {dbStatus}</span>
                </>
              ) : (
                <span className="text-rose-400">API Offline</span>
              )}
            </span>
            <button
              onClick={checkHealth}
              disabled={healthLoading}
              title="Refresh Health Diagnostics"
              className="ml-1 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg
                className={`h-3.5 w-3.5 ${healthLoading ? 'animate-spin' : ''}`}
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
            className="hidden sm:inline-flex items-center space-x-1.5 rounded-full bg-slate-800/60 hover:bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-all border border-slate-700/40"
          >
            <span>Swagger API</span>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Login / Hero Presentation View */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md">
          {/* Mock Feedback Notification Toast */}
          {showMockToast && (
            <div className="mb-4 rounded-xl border border-indigo-500/40 bg-indigo-950/80 p-3.5 text-xs text-indigo-200 backdrop-blur-xl shadow-[0_0_25px_rgba(99,102,241,0.3)] animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center space-x-2">
                <span className="text-base">🚀</span>
                <div>
                  <p className="font-semibold text-white">Day 1 Interface Preview</p>
                  <p className="text-[11px] text-indigo-300">
                    Live authentication, JWT verification, and user sessions activate on Day 2.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Premium Glassmorphic Card */}
          <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300 hover:border-slate-700/80">
            {/* Card Header */}
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.25)]">
                <span className="text-2xl">⚡</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
                {authMode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-1.5 text-xs text-slate-400">
                {authMode === 'signin'
                  ? 'Sign in to access DevPulse discussions, ranking, and feeds'
                  : 'Join the next-generation developer community'}
              </p>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="mt-6 flex rounded-xl bg-slate-950/70 p-1 border border-slate-800/70">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Login / Signup Form */}
            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setShowMockToast(true)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
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

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs text-slate-400">Remember this browser</span>
                </label>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:opacity-95 hover:shadow-indigo-500/35 active:scale-[0.99] cursor-pointer"
              >
                {authMode === 'signin' ? 'Sign In to DevPulse' : 'Create DevPulse Account'}
              </button>
            </form>

            {/* Social Authentication Dividers */}
            <div className="mt-6">
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-800" />
                <span className="bg-slate-900/90 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Or continue with
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* GitHub */}
                <button
                  type="button"
                  onClick={() => setShowMockToast(true)}
                  className="flex items-center justify-center space-x-2 rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub</span>
                </button>

                {/* Google */}
                <button
                  type="button"
                  onClick={() => setShowMockToast(true)}
                  className="flex items-center justify-center space-x-2 rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
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

            {/* Micro Indicator Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-500">
                ⚡ DevPulse Sprint • Day 1 Scaffolding complete
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Bottom Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-slate-900/80">
        DevPulse © 2026 • Engineered for developers, by developers.
      </footer>
    </div>
  );
}
