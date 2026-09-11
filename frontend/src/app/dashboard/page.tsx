'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/lib/api';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

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
      <div className="flex h-screen w-screen items-center justify-center bg-white font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs text-zinc-600 font-medium tracking-wide">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative font-sans text-zinc-900 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* High-end clean static backdrop (No motion dev animation) */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-45 pointer-events-none"
        aria-hidden="true"
      />
      {/* Subtle soft static ambient tints for depth and glass card contrast */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[520px] bg-gradient-to-b from-indigo-50/70 via-purple-50/40 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 px-6 py-10 lg:px-16">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Welcome Banner Glassmorphism Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl border border-white/10 bg-[#090d16]/95 p-8 sm:p-10 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden text-left"
          >
            {/* Ambient top border gradient & glow orbs */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-[11px] text-emerald-300 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Authenticated Session Active</span>
                </div>

                {/* Active Role Badge */}
                <div className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1 text-xs text-zinc-300">
                  <span className="text-[11px] text-zinc-400">Current Role:</span>
                  <span
                    className={`font-mono text-xs font-bold uppercase ${
                      user?.role === 'admin'
                        ? 'text-purple-300'
                        : 'text-indigo-300'
                    }`}
                  >
                    {user?.role || 'user'}
                  </span>
                </div>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  Welcome back,{' '}
                  <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
                    {user?.name || 'Developer'}
                  </span>
                </h1>
                <p className="mt-2 text-sm text-zinc-400 max-w-2xl leading-relaxed">
                  You are securely signed in with an <strong className="text-zinc-200">httpOnly</strong> session cookie.
                  Below are interactive proof-of-concept diagnostics for Day 2 Auth verification.
                </p>
              </div>

              {/* Professional User & Admin Quick Action Buttons with Matching Gradient BG */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* User Button (Primary Accent Gradient) */}
                <button
                  id="quick-btn-user"
                  onClick={handleTestMe}
                  disabled={meLoading}
                  className="group relative flex-1 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-blue-500 p-4 text-left shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] border border-indigo-400/30 cursor-pointer disabled:opacity-60"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
                      <svg
                        className="h-5 w-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
                          User Action
                        </span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                          Primary Accent
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-white block">
                        Verify User Identity
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs font-mono text-indigo-100/90 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                    {meLoading ? 'Calling...' : 'GET /auth/me →'}
                  </div>
                </button>

                {/* Admin Button (Secondary Color Gradient) */}
                <button
                  id="quick-btn-admin"
                  onClick={handleTestAdmin}
                  disabled={adminLoading}
                  className="group relative flex-1 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 p-4 text-left shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] border border-purple-400/30 cursor-pointer disabled:opacity-60"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
                      <svg
                        className="h-5 w-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-100">
                          Admin Action
                        </span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                          Secondary Color
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-white block">
                        Verify Admin Privileges
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs font-mono text-purple-100/90 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                    {adminLoading ? 'Checking...' : 'GET /admin-check →'}
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Diagnostic Proof-of-Concept Interactive Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: JWT Verification (/auth/me) - User Scope */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative rounded-3xl border border-white/10 bg-[#090d16]/95 p-7 sm:p-8 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35),0_0_0_1px_rgba(255,255,255,0.06)] flex flex-col justify-between text-left overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
              <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      1. User Identity Guard
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    GET /auth/me
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-normal leading-relaxed">
                  Calls protected endpoint through Passport-JWT guard. Proves the session cookie forwards a valid signed Bearer token to NestJS.
                </p>

                <AnimatePresence>
                  {Boolean(meResult) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-[11px] text-zinc-300 shadow-inner"
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-emerald-400 text-[10px]">
                        <span>● Status: 200 OK</span>
                        <span>User Session Verified</span>
                      </div>
                      <pre className="overflow-x-auto">
                        {JSON.stringify(meResult, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Button with Primary Accent Gradient */}
              <button
                id="btn-test-me"
                onClick={handleTestMe}
                disabled={meLoading}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-blue-500 py-3.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 border border-indigo-400/30 cursor-pointer"
              >
                {meLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying JWT with Backend...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>User: Verify Identity via /auth/me</span>
                  </>
                )}
              </button>
            </motion.div>

            {/* Card 2: Role Authorization (/auth/admin-check) - Admin Scope */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative rounded-3xl border border-white/10 bg-[#090d16]/95 p-7 sm:p-8 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35),0_0_0_1px_rgba(255,255,255,0.06)] flex flex-col justify-between text-left overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
              <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      2. Admin Authorization Guard
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    GET /auth/admin-check
                  </span>
                </div>

                <p className="text-xs text-zinc-400 font-normal leading-relaxed">
                  Protected with <code className="text-indigo-300 font-mono">@Roles(&apos;admin&apos;)</code>. Returns 200 Success for admin users, or 403 Forbidden with standard error envelope for normal users.
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
                        <pre className="mt-2 overflow-x-auto text-[10px] text-zinc-300 bg-black/40 p-2.5 rounded-lg border border-white/5">
                          {JSON.stringify(adminResult?.data, null, 2)}
                        </pre>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Admin Button with Secondary Color Gradient */}
              <button
                id="btn-test-admin"
                onClick={handleTestAdmin}
                disabled={adminLoading}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 py-3.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 border border-purple-400/30 cursor-pointer"
              >
                {adminLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Evaluating Permissions...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>Admin: Test Privilege (/auth/admin-check)</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {/* User Session Metadata Details Glassmorphic Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="relative rounded-3xl border border-white/10 bg-[#090d16]/95 p-6 sm:p-7 text-xs text-zinc-400 backdrop-blur-2xl shadow-[0_20px_50px_-15px_rgba(15,23,42,0.25),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden text-left"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-center">
              {/* Item 1: Active User ID */}
              <div className="space-y-1">
                <span className="text-zinc-500 block text-[11px] font-medium tracking-wide uppercase">
                  Active User ID
                </span>
                <span className="font-mono text-zinc-200 font-semibold text-xs block truncate" title={user?.id}>
                  {user?.id || '—'}
                </span>
              </div>

              {/* Item 2: Registered Email */}
              <div className="space-y-1">
                <span className="text-zinc-500 block text-[11px] font-medium tracking-wide uppercase">
                  Registered Email
                </span>
                <span className="font-mono text-zinc-200 font-semibold text-xs block truncate" title={user?.email}>
                  {user?.email || '—'}
                </span>
              </div>

              {/* Item 3: Token Transport */}
              <div className="space-y-1">
                <span className="text-zinc-500 block text-[11px] font-medium tracking-wide uppercase">
                  Token Transport
                </span>
                <span className="font-mono text-indigo-300 font-semibold text-xs block truncate">
                  httpOnly Cookie (devpulse_token)
                </span>
              </div>

              {/* Item 4: Effective Role Badge */}
              <div className="space-y-1">
                <span className="text-zinc-500 block text-[11px] font-medium tracking-wide uppercase">
                  Effective Role
                </span>
                <div className="inline-flex items-center">
                  <span
                    className={`inline-flex items-center space-x-1.5 font-mono text-xs font-bold uppercase px-3 py-1 rounded-lg border shadow-sm ${
                      user?.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${user?.role === 'admin' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
                    <span>{user?.role || 'user'}</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
