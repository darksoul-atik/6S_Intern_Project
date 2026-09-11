'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-12">
        
        {/* Left: Brand Logo */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-[0_0_18px_rgba(99,102,241,0.35)] transition-transform group-hover:scale-105">
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
            <span className="text-lg font-bold tracking-tight text-white font-sans">
              DevPulse
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden sm:flex items-center space-x-1">
            <Link
              href="/"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              Overview
            </Link>
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  pathname.startsWith('/dashboard')
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Auth Status & Controls */}
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <div className="h-5 w-20 bg-white/5 rounded-md animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              {/* User Identity & Role Badge */}
              <div className="flex items-center space-x-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur-md">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-zinc-200 max-w-[140px] truncate sm:max-w-none">
                  {user.name || user.email}
                </span>
                <span
                  id="navbar-user-role-badge"
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    user.role === 'admin'
                      ? 'bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-emerald-500/30 text-indigo-300 border border-indigo-400/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                id="navbar-logout-btn"
                onClick={() => logout()}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 hover:border-red-500/40 transition-all active:scale-95"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_16px_rgba(99,102,241,0.3)] hover:shadow-[0_0_22px_rgba(99,102,241,0.5)] hover:brightness-110 transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
