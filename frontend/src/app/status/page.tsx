'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FiActivity,
  FiDatabase,
  FiServer,
  FiCheckCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiArrowLeft,
  FiClock,
} from 'react-icons/fi';
import { getHealthStatus, type HealthData } from '@/services/api/health';
import { ApiError } from '@/types/api';

export default function StatusPage() {
  const {
    data: health,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    failureCount,
  } = useQuery<HealthData | undefined>({
    queryKey: ['health'],
    queryFn: async () => {
      try {
        return await getHealthStatus();
      } catch (err: unknown) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { status?: number; data?: unknown } }).response?.status === 503
        ) {
          const resData = (err as { response?: { data?: unknown } }).response?.data;
          if (resData && typeof resData === 'object') {
            return resData as HealthData;
          }
        }
        throw err;
      }
    },
    retry: 2,
    refetchInterval: 30000, // Background refresh every 30s
  });

  const isDbConnected =
    !isLoading &&
    !isError &&
    (health?.database?.status === 'connected' || health?.db === 'connected');
  const isFullyOperational =
    !isLoading && !isError && health?.status === 'ok' && isDbConnected;
  const isDegraded =
    !isLoading &&
    !isError &&
    Boolean(health) &&
    (health?.status === 'degraded' || !isDbConnected);
  const isApiReachable = !isLoading && !isError && Boolean(health);

  const dbConnectionState =
    health?.database?.connectionState ?? (isDbConnected ? 1 : 0);


  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      {/* Background ambient lighting */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[450px] rounded-full bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold font-manrope text-zinc-400 hover:text-white transition-colors mb-2"
            >
              <FiArrowLeft className="h-3.5 w-3.5" />
              <span>Back to DevPulse</span>
            </Link>
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400">
                <FiActivity className="h-4 w-4 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-manrope tracking-tight text-white">
                System Status & Health
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans">
              Live server-state diagnostics managed via TanStack Query and verified against MongoDB Atlas.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              id="status-refresh-btn"
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/10 text-xs font-semibold font-manrope text-zinc-200 hover:text-white transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
            >
              <FiRefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-indigo-400' : ''}`}
              />
              <span>{isFetching ? 'Checking...' : 'Refresh Status'}</span>
            </button>
          </div>
        </div>

        {/* Global Banner: Overall Status State */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`rounded-3xl border p-5 sm:p-7 backdrop-blur-2xl transition-all shadow-xl ${
            isLoading
              ? 'border-indigo-500/30 bg-indigo-950/20'
              : isFullyOperational
              ? 'border-emerald-500/30 bg-emerald-950/20'
              : isDegraded
              ? 'border-amber-500/30 bg-amber-950/20'
              : 'border-rose-500/30 bg-rose-950/20'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isLoading
                    ? 'border-indigo-400/40 bg-indigo-500/20 text-indigo-300'
                    : isFullyOperational
                    ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                    : isDegraded
                    ? 'border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.3)]'
                    : 'border-rose-400/40 bg-rose-500/20 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.3)]'
                }`}
              >
                {isLoading ? (
                  <FiRefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
                ) : isFullyOperational ? (
                  <FiCheckCircle className="h-6 w-6 text-emerald-400" />
                ) : isDegraded ? (
                  <FiAlertTriangle className="h-6 w-6 text-amber-400" />
                ) : (
                  <FiAlertTriangle className="h-6 w-6 text-rose-400" />
                )}
              </div>

              <div className="space-y-0.5 min-w-0">
                <span className="text-[11px] uppercase tracking-wider font-bold font-mono text-zinc-400 block">
                  Overall System Health
                </span>
                <h2 className="text-lg sm:text-xl font-bold font-manrope text-white tracking-tight break-words">
                  {isLoading
                    ? 'Pinging DevPulse API & Database...'
                    : isFullyOperational
                    ? 'All Systems Operational'
                    : isDegraded
                    ? 'System Degraded: Database Disconnected'
                    : 'Backend Service Unavailable'}
                </h2>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  {isLoading
                    ? 'Querying live health check endpoint (/health) with TanStack Query.'
                    : isFullyOperational
                    ? 'NestJS REST API and MongoDB connection cluster are healthy and accepting traffic.'
                    : isDegraded
                    ? 'NestJS REST API is online, but MongoDB connection is disconnected or degraded.'
                    : 'Unable to reach backend server. The UI remains resilient and responsive without crashing.'}
                </p>
              </div>
            </div>

            {/* Status Pill Badge */}
            <div className="shrink-0">
              <span
                id="system-status-badge"
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider border ${
                  isLoading
                    ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-300'
                    : isFullyOperational
                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-xs'
                    : isDegraded
                    ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                    : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLoading
                      ? 'bg-indigo-400 animate-ping'
                      : isFullyOperational
                      ? 'bg-emerald-400 animate-pulse'
                      : isDegraded
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-400'
                  }`}
                />
                <span>
                  {isLoading
                    ? 'Checking'
                    : isFullyOperational
                    ? 'Operational'
                    : isDegraded
                    ? 'Degraded'
                    : 'Offline'}
                </span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Retry Notice if Backend is Stopped */}
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs font-sans text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center space-x-2.5">
              <FiAlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>TanStack Query Retry Handled:</strong> Connection failed after {failureCount || 1} attempt(s).
                Error: {error instanceof ApiError ? error.message : 'Network error or server down.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-100 hover:bg-amber-500/30 font-semibold font-manrope shrink-0 transition-colors"
            >
              Retry Now
            </button>
          </motion.div>
        )}

        {/* Diagnostic Component Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Component 1: NestJS API Service */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400">
                  <FiServer className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-manrope text-white">
                    NestJS API Service
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Core HTTP & WebSocket Server
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                  isLoading
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    : isApiReachable
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-400/30'
                }`}
              >
                {isLoading ? 'Checking' : isApiReachable ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="p-3 bg-black/30 rounded-2xl border border-white/5 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Endpoint:</span>
                <span className="text-zinc-200">GET /health</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Response Envelope:</span>
                <span className="text-emerald-400">TransformInterceptor</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Server Time:</span>
                <span className="text-zinc-200">
                  {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Component 2: MongoDB Mongoose Database */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                  <FiDatabase className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-manrope text-white">
                    MongoDB Database
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Mongoose Connection Pool
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                  isLoading
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    : isDbConnected
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-400/30'
                }`}
              >
                {isLoading
                  ? 'Checking'
                  : isDbConnected
                  ? 'Connected'
                  : 'Disconnected'}
              </span>
            </div>

            <div className="p-3 bg-black/30 rounded-2xl border border-white/5 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Driver:</span>
                <span className="text-zinc-200">Mongoose ODM</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Connection State:</span>
                <span className={isDbConnected ? 'text-emerald-400' : 'text-rose-400'}>
                  {`${dbConnectionState} (${isDbConnected ? 'Connected' : 'Disconnected'})`}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Cluster:</span>
                <span className="text-zinc-200">MongoDB Atlas / Local</span>
              </div>
            </div>
          </div>
        </div>

        {/* TanStack Query Server-State Lifecycle Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 backdrop-blur-xl space-y-3">
          <div className="flex items-center space-x-2 text-zinc-300">
            <FiClock className="h-4 w-4 text-indigo-400" />
            <h4 className="text-xs font-bold font-manrope uppercase tracking-wider">
              TanStack Query Server-State Lifecycle
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
              <span className="text-zinc-400 block text-[11px]">Query Key</span>
              <strong className="text-indigo-300 font-mono">[&apos;health&apos;]</strong>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
              <span className="text-zinc-400 block text-[11px]">Stale Time</span>
              <strong className="text-white font-mono">60,000 ms</strong>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
              <span className="text-zinc-400 block text-[11px]">Retry Policy</span>
              <strong className="text-white font-mono">2 attempts</strong>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
              <span className="text-zinc-400 block text-[11px]">Background Refetch</span>
              <strong className="text-emerald-300 font-mono">Active (30s)</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
