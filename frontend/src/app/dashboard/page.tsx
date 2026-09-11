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
      {/* Background Dot Texture */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none"
        aria-hidden="true"
      />

      {/* Radiant ambient glow orbs behind glass cards for vivid refraction */}
      <div
        className="absolute top-12 left-1/4 -translate-x-1/2 w-[550px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-300/35 via-blue-200/25 to-transparent blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-28 right-1/4 translate-x-1/3 w-[600px] h-[520px] rounded-full bg-gradient-to-bl from-purple-300/35 via-violet-200/25 to-transparent blur-[130px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[750px] h-[400px] rounded-full bg-gradient-to-r from-emerald-200/25 via-teal-200/20 to-indigo-200/20 blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 px-4 sm:px-6 md:px-10 lg:px-16 py-6 sm:py-10">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Welcome Banner: High-End Frosted Glassmorphism Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl border border-white/70 bg-white/55 p-6 sm:p-8 md:p-10 backdrop-blur-3xl backdrop-saturate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8),inset_0_1px_2px_rgba(255,255,255,0.95)] overflow-hidden text-left"
          >
            {/* Specular highlight rim */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95" />
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-purple-300/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              {/* Status Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-300/60 bg-emerald-50/80 px-3.5 py-1 text-[11px] text-emerald-700 font-medium backdrop-blur-md shadow-xs">
                  <FiActivity className="h-3 w-3 text-emerald-600 animate-pulse" />
                  <span>Session Active</span>
                </div>

                {/* Active Role Badge */}
                <div className="inline-flex items-center space-x-2 rounded-full border border-white/80 bg-white/70 px-3.5 py-1 text-xs text-slate-700 backdrop-blur-md shadow-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Role:</span>
                  <span
                    className={`font-mono text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      user?.role === 'admin'
                        ? 'text-purple-700 bg-purple-100/80 border border-purple-200/80'
                        : 'text-indigo-700 bg-indigo-100/80 border border-indigo-200/80'
                    }`}
                  >
                    {user?.role || 'user'}
                  </span>
                </div>
              </div>

              {/* Title & Subtitle (Clean layout without box/dot) */}
              <div className="space-y-2 max-w-3xl">
                <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold font-manrope tracking-tight text-slate-900 leading-tight">
                  Welcome back,{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
                    {user?.name || 'Developer'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                  You are securely signed in with an <strong className="text-slate-800 font-semibold">httpOnly</strong> session cookie.
                  Manage your authenticated session and explore role permissions below.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {/* User Action Button */}
                <button
                  id="quick-btn-user"
                  type="button"
                  onClick={handleTestMe}
                  disabled={meLoading}
                  className="group relative flex-1 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-blue-500 p-4 text-left shadow-[0_12px_28px_-6px_rgba(79,70,229,0.35),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:shadow-[0_16px_36px_-6px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] border border-indigo-400/40 cursor-pointer disabled:opacity-60"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 border border-white/25 shadow-inner group-hover:scale-105 transition-transform">
                      <FiUser className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-[11px] sm:text-xs font-bold font-manrope uppercase tracking-wider text-indigo-100 block">
                        User Session
                      </span>
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

                {/* Admin Action Button */}
                <button
                  id="quick-btn-admin"
                  type="button"
                  onClick={handleTestAdmin}
                  disabled={adminLoading}
                  className="group relative flex-1 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 p-4 text-left shadow-[0_12px_28px_-6px_rgba(147,51,234,0.35),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:shadow-[0_16px_36px_-6px_rgba(147,51,234,0.5)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] border border-purple-400/40 cursor-pointer disabled:opacity-60"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 border border-white/25 shadow-inner group-hover:scale-105 transition-transform">
                      <FiShield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-[11px] sm:text-xs font-bold font-manrope uppercase tracking-wider text-purple-100 block">
                        Admin Security
                      </span>
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

          {/* Diagnostic Interactive Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            
            {/* Card 1: User Identity Card (Frosted Glassmorphic) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative rounded-3xl border border-white/70 bg-white/55 p-5 sm:p-7 md:p-8 backdrop-blur-3xl backdrop-saturate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8),inset_0_1px_2px_rgba(255,255,255,0.95)] flex flex-col justify-between text-left overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95" />
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 border border-white/90 text-indigo-600 shadow-xs backdrop-blur-md">
                      <FiUser className="h-4 w-4" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold font-manrope text-slate-900 tracking-tight">
                      User Identity Check
                    </h3>
                  </div>
                  <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-lg bg-white/80 text-indigo-700 border border-indigo-200/80 font-mono font-semibold shrink-0 shadow-2xs backdrop-blur-sm">
                    GET /auth/me
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-sans font-normal leading-relaxed">
                  Verifies your active credentials and session tokens with the secure identity service. Confirms your account profile details.
                </p>

                <AnimatePresence>
                  {Boolean(meResult) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 p-4 font-mono text-[11px] text-slate-200 backdrop-blur-2xl shadow-xl"
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-emerald-400 text-[10px]">
                        <div className="flex items-center space-x-2">
                          <FiCheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="font-semibold">Status: 200 OK</span>
                        </div>
                        <span className="text-slate-400">User Verified</span>
                      </div>
                      <pre className="overflow-x-auto text-[10px] sm:text-[11px] text-slate-300">
                        {JSON.stringify(meResult, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>

            {/* Card 2: Role Authorization Card (Frosted Glassmorphic) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative rounded-3xl border border-white/70 bg-white/55 p-5 sm:p-7 md:p-8 backdrop-blur-3xl backdrop-saturate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8),inset_0_1px_2px_rgba(255,255,255,0.95)] flex flex-col justify-between text-left overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95" />
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-purple-300/20 blur-3xl pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 border border-white/90 text-purple-600 shadow-xs backdrop-blur-md">
                      <FiShield className="h-4 w-4" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold font-manrope text-slate-900 tracking-tight">
                      Admin Access Verification
                    </h3>
                  </div>
                  <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-lg bg-white/80 text-purple-700 border border-purple-200/80 font-mono font-semibold shrink-0 shadow-2xs backdrop-blur-sm">
                    GET /auth/admin-check
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-sans font-normal leading-relaxed">
                  Validates elevated administrator permissions. Verifies if your current signed-in account is granted authorized admin access.
                </p>

                <AnimatePresence>
                  {Boolean(adminResult) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-3 rounded-2xl border p-4 text-xs shadow-lg backdrop-blur-xl ${
                        adminResult?.success
                          ? 'border-emerald-200/80 bg-emerald-50/80 text-emerald-900'
                          : 'border-rose-200/80 bg-rose-50/80 text-rose-900'
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
                        <pre className="mt-2 overflow-x-auto text-[10px] sm:text-[11px] text-slate-200 bg-slate-950/90 p-3 rounded-xl border border-slate-800 font-mono shadow-inner">
                          {JSON.stringify(adminResult?.data, null, 2)}
                        </pre>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
