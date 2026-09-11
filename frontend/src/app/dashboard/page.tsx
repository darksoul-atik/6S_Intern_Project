'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiActivity,
  FiTerminal,
  FiLock,
} from 'react-icons/fi';
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
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-600 font-medium tracking-wide">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* High-end subtle dot backdrop */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none"
        aria-hidden="true"
      />
      {/* Soft ambient gradient glow orbs behind glass cards for luxury depth */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[480px] bg-gradient-to-b from-indigo-100/60 via-purple-100/40 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 px-4 sm:px-6 md:px-10 lg:px-16 py-6 sm:py-10">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Welcome Banner: White Glassmorphism Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl border border-white/80 bg-white/75 p-5 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_20px_50px_-15px_rgba(15,23,42,0.07),0_0_0_1px_rgba(255,255,255,0.9)] overflow-hidden text-left"
          >
            {/* Ambient specular highlight shimmer line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-1 text-[11px] text-emerald-700 font-medium shadow-xs">
                  <FiActivity className="h-3 w-3 text-emerald-600 animate-pulse" />
                  <span>Authenticated Session Active</span>
                </div>

                {/* Active Role Badge */}
                <div className="inline-flex items-center space-x-2 rounded-full border border-slate-200/80 bg-slate-50/90 px-3.5 py-1 text-xs text-slate-600 shadow-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Current Role:</span>
                  <span
                    className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                      user?.role === 'admin'
                        ? 'text-purple-700 bg-purple-100/90 border border-purple-200'
                        : 'text-indigo-700 bg-indigo-100/90 border border-indigo-200'
                    }`}
                  >
                    {user?.role || 'user'}
                  </span>
                </div>
              </div>

              {/* Headline & Subtitle */}
              <div>
                <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold font-manrope tracking-tight text-slate-900 leading-tight">
                  Welcome back,{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
                    {user?.name || 'Developer'}
                  </span>
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed font-sans">
                  You are securely signed in with an <strong className="text-slate-800 font-semibold">httpOnly</strong> session cookie.
                  Below are interactive proof-of-concept diagnostics for Day 2 Auth verification.
                </p>
              </div>

              {/* Professional User & Admin Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {/* User Button (Primary Accent Gradient) */}
                <button
                  id="quick-btn-user"
                  type="button"
                  onClick={handleTestMe}
                  disabled={meLoading}
                  className="group relative flex-1 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-blue-500 p-4 text-left shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] border border-indigo-400/30 cursor-pointer disabled:opacity-60"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
                      <FiUser className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] sm:text-xs font-bold font-manrope uppercase tracking-wider text-indigo-100">
                          User Action
                        </span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white">
                          Primary Accent
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold font-manrope text-white block mt-0.5">
                        Verify User Identity
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-100 bg-black/25 px-2.5 py-1 rounded-lg border border-white/10 self-end xs:self-auto">
                    <span>{meLoading ? 'Calling...' : 'GET /auth/me'}</span>
                    <FiArrowRight className="h-3 w-3 text-indigo-200" />
                  </div>
                </button>

                {/* Admin Button (Secondary Color Gradient) */}
                <button
                  id="quick-btn-admin"
                  type="button"
                  onClick={handleTestAdmin}
                  disabled={adminLoading}
                  className="group relative flex-1 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 p-4 text-left shadow-lg shadow-purple-600/20 hover:shadow-purple-500/35 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] border border-purple-400/30 cursor-pointer disabled:opacity-60"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
                      <FiShield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] sm:text-xs font-bold font-manrope uppercase tracking-wider text-purple-100">
                          Admin Action
                        </span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white">
                          Secondary Color
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold font-manrope text-white block mt-0.5">
                        Verify Admin Privileges
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-purple-100 bg-black/25 px-2.5 py-1 rounded-lg border border-white/10 self-end xs:self-auto">
                    <span>{adminLoading ? 'Checking...' : 'GET /admin-check'}</span>
                    <FiArrowRight className="h-3 w-3 text-purple-200" />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Diagnostic Proof-of-Concept Interactive Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            
            {/* Card 1: JWT Verification (/auth/me) - User Scope (White Glassmorphism) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative rounded-3xl border border-white/80 bg-white/75 p-5 sm:p-7 md:p-8 backdrop-blur-2xl shadow-[0_20px_50px_-15px_rgba(15,23,42,0.07),0_0_0_1px_rgba(255,255,255,0.9)] flex flex-col justify-between text-left overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
              <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
                      <FiUser className="h-4 w-4" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold font-manrope text-slate-900 tracking-tight">
                      1. User Identity Guard
                    </h3>
                  </div>
                  <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-mono font-semibold shrink-0">
                    GET /auth/me
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-sans font-normal leading-relaxed">
                  Calls protected endpoint through Passport-JWT guard. Proves the session cookie forwards a valid signed Bearer token to NestJS.
                </p>

                <AnimatePresence>
                  {Boolean(meResult) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-200 shadow-xl"
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-emerald-400 text-[10px]">
                        <div className="flex items-center space-x-1.5">
                          <FiCheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="font-semibold">Status: 200 OK</span>
                        </div>
                        <span className="text-slate-400">User Session Verified</span>
                      </div>
                      <pre className="overflow-x-auto text-[10px] sm:text-[11px] text-slate-300">
                        {JSON.stringify(meResult, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Test Button */}
              <button
                id="btn-test-me"
                type="button"
                onClick={handleTestMe}
                disabled={meLoading}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-blue-500 py-3.5 px-4 text-xs sm:text-sm font-semibold font-manrope text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 border border-indigo-400/30 cursor-pointer"
              >
                {meLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying JWT with Backend...</span>
                  </>
                ) : (
                  <>
                    <FiUser className="h-4 w-4" />
                    <span>User: Verify Identity via /auth/me</span>
                  </>
                )}
              </button>
            </motion.div>

            {/* Card 2: Role Authorization (/auth/admin-check) - Admin Scope (White Glassmorphism) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative rounded-3xl border border-white/80 bg-white/75 p-5 sm:p-7 md:p-8 backdrop-blur-2xl shadow-[0_20px_50px_-15px_rgba(15,23,42,0.07),0_0_0_1px_rgba(255,255,255,0.9)] flex flex-col justify-between text-left overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600 shadow-xs">
                      <FiShield className="h-4 w-4" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold font-manrope text-slate-900 tracking-tight">
                      2. Admin Authorization Guard
                    </h3>
                  </div>
                  <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/70 font-mono font-semibold shrink-0">
                    GET /auth/admin-check
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-sans font-normal leading-relaxed">
                  Protected with <code className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200 font-mono text-[11px]">@Roles(&apos;admin&apos;)</code>. Returns 200 Success for admin users, or 403 Forbidden with standard error envelope for normal users.
                </p>

                <AnimatePresence>
                  {Boolean(adminResult) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-3 rounded-2xl border p-4 text-xs shadow-lg ${
                        adminResult?.success
                          ? 'border-emerald-200 bg-emerald-50/90 text-emerald-900'
                          : 'border-rose-200 bg-rose-50/90 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 font-mono text-[11px]">
                        {adminResult?.success ? (
                          <FiCheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <FiAlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                        <span className="font-bold">
                          {adminResult?.success ? '200 OK:' : `${adminResult?.statusCode || 403} FORBIDDEN:`}
                        </span>
                        <span className="truncate">{adminResult?.message}</span>
                      </div>
                      {Boolean(adminResult?.data) && (
                        <pre className="mt-2 overflow-x-auto text-[10px] sm:text-[11px] text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                          {JSON.stringify(adminResult?.data, null, 2)}
                        </pre>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Admin Test Button */}
              <button
                id="btn-test-admin"
                type="button"
                onClick={handleTestAdmin}
                disabled={adminLoading}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 py-3.5 px-4 text-xs sm:text-sm font-semibold font-manrope text-white shadow-lg shadow-purple-600/20 hover:shadow-purple-500/35 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 border border-purple-400/30 cursor-pointer"
              >
                {adminLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Evaluating Permissions...</span>
                  </>
                ) : (
                  <>
                    <FiShield className="h-4 w-4" />
                    <span>Admin: Test Privilege (/auth/admin-check)</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
