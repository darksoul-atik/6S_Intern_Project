'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface HealthData {
  status: string;
  db: 'connected' | 'disconnected';
}

export default function Home() {
  const [loading, setLoading] = useState<boolean>(true);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [dbStatus, setDbStatus] = useState<string>('unknown');
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient<HealthData>('/health');
      if (response.success && response.data) {
        setApiConnected(true);
        setDbStatus(response.data.db);
      } else {
        setApiConnected(false);
        setDbStatus('unknown');
      }
    } catch (err: unknown) {
      setApiConnected(false);
      setDbStatus('unknown');
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to connect to backend'
      );
    } finally {
      setLoading(false);
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
              Day 1 • Foundation
            </span>
            <span className="text-xs font-semibold tracking-wide text-slate-400">DevPulse</span>

          </div>
          <h1 className="text-2xl font-bold text-white mt-3">
            System Health & Diagnostics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Validates live communication between the Next.js client and NestJS API with Mongoose.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* API Status */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              API Connection
            </span>
            <div className="mt-3 flex items-center space-x-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  loading
                    ? 'bg-amber-400 animate-pulse'
                    : apiConnected
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                    : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                }`}
              />
              <span className="text-base font-semibold text-white">
                {loading
                  ? 'Checking...'
                  : apiConnected
                  ? 'API connected'
                  : 'API unreachable'}
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-2 font-mono truncate">
              {apiUrl}
            </span>
          </div>

          {/* Database Status */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Database (Mongoose)
            </span>
            <div className="mt-3 flex items-center space-x-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  loading
                    ? 'bg-amber-400 animate-pulse'
                    : dbStatus === 'connected'
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                    : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]'
                }`}
              />
              <span className="text-base font-semibold text-white">
                {loading
                  ? 'Checking...'
                  : dbStatus === 'connected'
                  ? 'DB connected'
                  : dbStatus === 'disconnected'
                  ? 'DB disconnected'
                  : 'Unknown'}
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-2 font-mono">
              MongoDB Atlas via Mongoose
            </span>
          </div>
        </div>

        {/* Error Callout if API unreachable */}
        {errorMessage && !loading && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
            <span className="font-semibold">Connection Error:</span> {errorMessage}
          </div>
        )}

        {/* Actions & Metadata */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800">
          <div>
            {lastChecked && (
              <span>
                Last check: <span className="font-mono text-slate-300">{lastChecked}</span>
              </span>
            )}
          </div>
          <button
            onClick={checkHealth}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shadow-md"
          >
            {loading ? 'Testing Connection...' : 'Re-check Status'}
          </button>
        </div>
      </div>
    </main>
  );
}
