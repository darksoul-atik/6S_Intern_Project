'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/lib/api';
import { MeshGradientBackground } from '@/components/MeshGradientBackground';

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();

  const [meResult, setMeResult] = useState<Record<string, unknown> | null>(null);
  const [meLoading, setMeLoading] = useState(false);
  const [adminResult, setAdminResult] = useState<{
    success: boolean;
    statusCode?: number;
    message?: string;
    data?: Record<string, unknown>;
  } | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Test GET /api/auth/me
  const handleTestMe = async () => {
    setMeLoading(true);
    setMeResult(null);
    try {
      const res = await apiClient<Record<string, unknown>>('/api/auth/me');
      setMeResult(res as unknown as Record<string, unknown>);
    } catch (err) {
      if (err instanceof ApiError) {
        setMeResult({
          success: false,
          statusCode: err.statusCode,
          message: err.message,
          errors: err.errors,
        });
      } else {
        setMeResult({ success: false, message: 'Network or server error' });
      }
    } finally {
      setMeLoading(false);
    }
  };

  // Test GET /api/auth/admin-check
  const handleTestAdmin = async () => {
    setAdminLoading(true);
    setAdminResult(null);
    try {
      const res = await apiClient<Record<string, unknown>>('/api/auth/admin-check');
      setAdminResult({
        success: res.success,
        message: res.message,
        data: res.data,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setAdminResult({
          success: false,
          statusCode: err.statusCode,
          message: err.message,
        });
      } else {
        setAdminResult({
          success: false,
          statusCode: 500,
          message: 'Network or server error',
        });
      }
    } finally {
      setAdminLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#080a10]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-9 w-9 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-medium tracking-wide">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <MeshGradientBackground
      colors={['#4f46e5', '#7c3aed', '#0284c7', '#059669']}
      speed={16}
      blur={130}
      interactive
    >
      <div className="min-h-screen px-6 py-10 lg:px-16 font-sans">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top Header Bar */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950/60 px-6 py-4 backdrop-blur-2xl shadow-xl"
          >
            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-transform group-hover:scale-105">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#080a10]">
                  <svg
                    className="h-4 w-4 text-indigo-400"
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
              <div>
                <span className="text-lg font-bold tracking-tight text-white block">
                  DevPulse
                </span>
                <span className="text-[10px] text-zinc-400 block -mt-1">
                  Developer Portal
                </span>
              </div>
            </Link>

            {/* User Session Chip & Logout */}
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-zinc-200 font-medium">
                  {user?.name || user?.email}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    user?.role === 'admin'
                      ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-300 border border-indigo-400/30'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {user?.role || 'user'}
                </span>
              </div>

              <button
                id="dashboard-logout-btn"
                onClick={() => logout()}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:border-red-500/40 transition-all active:scale-95"
              >
                Sign Out
              </button>
            </div>
          </motion.div>

          {/* Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-white/10 bg-zinc-950/60 p-8 sm:p-10 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.56)] relative overflow-hidden text-left"
          >
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                <span>● Authenticated Session Active</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
                  {user?.name || 'Developer'}
                </span>
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                You are securely signed in with an <strong className="text-zinc-200">httpOnly</strong> session cookie.
                Below are interactive proof-of-concept diagnostics for Day 2 Auth verification.
              </p>
            </div>
          </motion.div>

          {/* Diagnostic Proof-of-Concept Interactive Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: JWT Verification (/auth/me) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-3xl border border-white/10 bg-zinc-950/60 p-7 sm:p-8 backdrop-blur-2xl shadow-xl flex flex-col justify-between text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    1. JWT Identity Guard
                  </h3>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    GET /auth/me
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Calls protected endpoint through Passport-JWT guard. Proves the session cookie forwards a valid signed Bearer token to NestJS.
                </p>

                <AnimatePresence>
                  {Boolean(meResult) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-[11px] text-zinc-300"
                    >
                      <pre className="overflow-x-auto">
                        {JSON.stringify(meResult, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                id="btn-test-me"
                onClick={handleTestMe}
                disabled={meLoading}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 text-xs font-semibold text-white shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {meLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying JWT with Backend...</span>
                  </>
                ) : (
                  <span>Verify Identity via /auth/me</span>
                )}
              </button>
            </motion.div>

            {/* Card 2: Role Authorization (/auth/admin-check) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="rounded-3xl border border-white/10 bg-zinc-950/60 p-7 sm:p-8 backdrop-blur-2xl shadow-xl flex flex-col justify-between text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    2. RolesGuard Authorization
                  </h3>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    GET /auth/admin-check
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Protected with <code className="text-indigo-300">@Roles(&apos;admin&apos;)</code>. Returns 200 Success for admin users, or 403 Forbidden with standard error envelope for normal users.
                </p>

                <AnimatePresence>
                  {Boolean(adminResult) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-3 rounded-xl border p-4 text-xs ${
                        adminResult?.success
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                          : 'border-red-500/30 bg-red-500/10 text-red-200'
                      }`}
                    >
                      <div className="flex items-start space-x-2 font-mono text-[11px]">
                        <span className="font-bold">
                          {adminResult?.success ? '✅ 200 OK:' : `⛔ ${adminResult?.statusCode || 403} FORBIDDEN:`}
                        </span>
                        <span>{adminResult?.message}</span>
                      </div>
                      {Boolean(adminResult?.data) && (
                        <pre className="mt-2 overflow-x-auto text-[10px] text-zinc-300 bg-black/40 p-2 rounded-lg">
                          {JSON.stringify(adminResult?.data, null, 2)}
                        </pre>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                id="btn-test-admin"
                onClick={handleTestAdmin}
                disabled={adminLoading}
                className={`mt-6 w-full rounded-xl py-3 text-xs font-semibold text-white shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 ${
                  user?.role === 'admin'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-purple-500/25'
                    : 'bg-gradient-to-r from-zinc-700 to-zinc-800 hover:bg-zinc-700'
                }`}
              >
                {adminLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Evaluating Permissions...</span>
                  </>
                ) : (
                  <span>Test Admin Privilege (/auth/admin-check)</span>
                )}
              </button>
            </motion.div>
          </div>

          {/* User Session Metadata Details */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-white/5 bg-zinc-950/40 p-5 text-xs text-zinc-400 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left"
          >
            <div>
              <span className="text-zinc-500 block">Active User ID:</span>
              <span className="font-mono text-zinc-300">{user?.id || '—'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Registered Email:</span>
              <span className="font-mono text-zinc-300">{user?.email || '—'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Effective Role:</span>
              <span className="font-mono text-emerald-400 font-bold uppercase">
                {user?.role || '—'}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </MeshGradientBackground>
  );
}
