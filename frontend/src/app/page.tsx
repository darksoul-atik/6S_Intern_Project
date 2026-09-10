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
  // Live health diagnostic state (Preserves Day 1 contract)
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [dbStatus, setDbStatus] = useState<string>('checking');
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Interactive modal / toast state for Day 1 preview
  const [showToast, setShowToast] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>('developer@devpulse.io');
  const [password, setPassword] = useState<string>('••••••••••••');

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

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  return (
    <MeshGradientBackground
      colors={['#4f46e5', '#8b5cf6', '#06b6d4', '#10b981']}
      speed={12}
      blur={120}
      interactive
    >
      {/* Top Navigation Bar */}
      <header className="relative z-30 flex items-center justify-between px-6 py-6 lg:px-12 backdrop-blur-md border-b border-white/10">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 shadow-[0_0_20px_rgba(99,102,241,0.6)]">
            <span className="text-xl font-black text-white">⚡</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">DevPulse</span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-white/20">
                Day 1 Active
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Developer Community Ecosystem</p>
          </div>
        </div>

        {/* Live System Diagnostics & API docs */}
        <div className="flex items-center space-x-3">
          {/* Health status badge */}
          <div
            title={`Backend: http://localhost:5000 | Last checked: ${lastChecked || 'just now'}`}
            className="flex items-center space-x-2.5 rounded-full bg-black/40 px-4 py-1.5 border border-white/15 backdrop-blur-xl shadow-lg transition-all hover:border-white/30"
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
                    ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]'
                    : 'bg-rose-500'
                }`}
              />
            </span>
            <span className="text-xs font-medium text-white">
              {healthLoading ? (
                'Probing System...'
              ) : apiConnected ? (
                <>
                  API Online • <span className="text-emerald-300">DB {dbStatus}</span>
                </>
              ) : (
                <span className="text-rose-400">API Offline</span>
              )}
            </span>
            <button
              onClick={checkHealth}
              disabled={healthLoading}
              title="Refresh Health Diagnostics"
              className="ml-1 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
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
            className="hidden sm:inline-flex items-center space-x-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-1.5 text-xs font-medium text-white transition-all border border-white/20 backdrop-blur-md"
          >
            <span>Swagger Docs</span>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </header>

      {/* Hero Section with Changed Words */}
      <main className="relative z-20 flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Operational Pill */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-semibold tracking-widest text-white uppercase bg-white/10 border border-white/20 rounded-full backdrop-blur-xl shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              DevPulse System Operational • Day 1 Complete
            </span>

            {/* Headline */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold text-white tracking-tighter mb-6 leading-[0.95]">
              Empowering the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300">
                Modern Developer
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-zinc-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
              A high-performance full-stack ecosystem engineered for developer discussions, 
              technical collaboration, algorithmic rankings, and real-time community engagement.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowLoginModal(true)}
                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)] cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>Open Login Preview</span>
                  <span>→</span>
                </span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-0 group-hover:opacity-25 transition-opacity" />
              </button>

              <a
                href="http://localhost:5000/docs"
                target="_blank"
                rel="noreferrer"
                className="px-8 py-4 bg-transparent text-white border border-white/20 rounded-full font-semibold backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
              >
                Explore Swagger API
              </a>
            </div>

            {/* Tech Stack Pills */}
            <div className="mt-16 flex flex-col items-center justify-center gap-4 text-zinc-400">
              <p className="text-xs font-semibold tracking-wider uppercase text-zinc-500">
                Architecture & Foundation
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                  NestJS 12
                </span>
                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                  Next.js 16 (App Router)
                </span>
                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                  MongoDB Atlas + Mongoose
                </span>
                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                  TypeScript 5
                </span>
                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
                  OpenAPI / Swagger
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Login Modal Preview (For Show) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-[#0c0d14]/90 p-8 shadow-2xl backdrop-blur-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/30">
                <span className="text-2xl">⚡</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">
                {authMode === 'signin' ? 'Welcome to DevPulse' : 'Create an Account'}
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Day 1 UI Preview • Live authentication activates on Day 2
              </p>
            </div>

            {/* Segmented Switcher */}
            <div className="mt-6 flex rounded-xl bg-black/40 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                  authMode === 'signin' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                  authMode === 'signup' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleAction} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full mt-1.5 rounded-xl border border-white/10 bg-black/40 py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full mt-1.5 rounded-xl border border-white/10 bg-black/40 py-2.5 px-3.5 text-xs text-white font-mono focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 py-3 text-xs font-semibold text-white shadow-lg hover:opacity-95 transition-all cursor-pointer"
              >
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Notification Toast in modal */}
            {showToast && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs text-center animate-in fade-in">
                ✨ Interface preview acknowledged! Authentication arrives on Day 2.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-20 py-6 text-center text-xs text-zinc-500 border-t border-white/10">
        DevPulse © 2026 • Next-generation developer collaboration hub.
      </footer>
    </MeshGradientBackground>
  );
}
