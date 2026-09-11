'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api';
import { MeshGradientBackground } from '@/components/MeshGradientBackground';
import { useAuth } from '@/context/AuthContext';

interface HealthData {
  status: string;
  db: 'connected' | 'disconnected';
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [healthStatus, setHealthStatus] = useState<string>('checking');
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected'>('connected');

  // Live health telemetry check
  useEffect(() => {
    apiClient<HealthData>('/health')
      .then((res) => {
        if (res.success && res.data) {
          setHealthStatus('operational');
          setDbStatus(res.data.db);
        }
      })
      .catch(() => {
        setHealthStatus('offline');
      });
  }, []);

  return (
    <MeshGradientBackground
      colors={['#4f46e5', '#7c3aed', '#0284c7', '#059669']}
      speed={14}
      blur={130}
      interactive
    >
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-6 py-12 lg:px-16 font-sans">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Brand, Motto & Passage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-7 text-left"
          >
            {/* Logo */}
            <div className="flex items-center space-x-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-[0_0_28px_rgba(99,102,241,0.45)]">
                <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#080a10]">
                  <svg
                    className="h-6 w-6 text-indigo-400"
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
              <span className="text-3xl font-extrabold tracking-tight text-white font-sans">
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

            {/* Live System Diagnostics Pill */}
            <div className="inline-flex items-center space-x-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-zinc-300 backdrop-blur-md">
              <span
                className={`flex h-2.5 w-2.5 rounded-full ${
                  healthStatus === 'operational' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>
                System: {healthStatus === 'operational' ? 'All Systems Operational' : 'Connecting to API...'} (DB: {dbStatus})
              </span>
            </div>
          </motion.div>

          {/* Right Column: Platform Portal & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 w-full max-w-md mx-auto"
          >
            <div className="relative rounded-3xl border border-white/10 bg-zinc-950/70 p-8 sm:p-10 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.56)]">
              {/* Card Ambient Glow Accent */}
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

              {isAuthenticated && user ? (
                /* Authenticated User View */
                <div className="space-y-6 text-left">
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400">
                      Active Session Verified
                    </span>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Welcome back, {user.name}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      You are currently signed in to your developer profile.
                    </p>
                  </div>

                  {/* Profile Summary Card */}
                  <div className="flex items-center space-x-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white font-bold text-base shadow-md">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-zinc-400 truncate">
                        {user.email}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                        user.role === 'admin'
                          ? 'bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-emerald-500/30 text-indigo-300 border border-indigo-400/30'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  {/* Authenticated Actions */}
                  <div className="space-y-3 pt-2">
                    <Link
                      href="/dashboard"
                      className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 py-3.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 transition-all active:scale-[0.99]"
                    >
                      <span>Open Developer Dashboard</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>

                    <button
                      onClick={() => logout()}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] py-3 text-xs font-medium text-zinc-300 hover:text-white transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                /* Unauthenticated Visitor Landing View */
                <div className="space-y-7 text-left">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Join DevPulse
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      Connect with thousands of engineers, share technical architecture patterns, and elevate your craft.
                    </p>
                  </div>

                  {/* Feature Highlights */}
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 backdrop-blur-sm">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                        ⚡
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Curated Engineering Feed</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Deep-dive technical articles, post-mortems, and system design debates.</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 backdrop-blur-sm">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                        🛡️
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Role-Based Workspaces</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Multi-tier privileges, verified member badges, and administrative moderation.</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 backdrop-blur-sm">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 text-xs font-bold">
                        🔐
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Enterprise-Grade Security</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">Bcrypt password hashing and httpOnly cookie session persistence.</div>
                      </div>
                    </div>
                  </div>

                  {/* Direct Action Buttons */}
                  <div className="space-y-3 pt-1">
                    <Link
                      href="/signup"
                      className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 py-3.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 transition-all active:scale-[0.99]"
                    >
                      <span>Create Free Account</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>

                    <Link
                      href="/login"
                      className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 py-3.5 text-xs font-medium text-zinc-200 hover:text-white transition-all active:scale-[0.99]"
                    >
                      <span>Sign In to Existing Account</span>
                    </Link>
                  </div>

                  <div className="text-center text-[11px] text-zinc-500">
                    Protected by DevPulse Identity & Access Management.
                  </div>
                </div>
              )}

            </div>
          </motion.div>

        </div>
      </div>
    </MeshGradientBackground>
  );
}
