'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  // Hide navbar on public landing and auth pages (root, login, signup) to prevent duplication
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xs transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-12">
        
        {/* Left: Brand Logo */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-[0_0_18px_rgba(99,102,241,0.25)] transition-transform group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-slate-950">
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
            <span className="text-base sm:text-lg font-bold font-manrope tracking-tight text-slate-900">
              DevPulse
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden sm:flex items-center space-x-1">
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold font-manrope transition-colors ${
                  pathname.startsWith('/dashboard')
                    ? 'bg-slate-100 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Auth Status & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {isLoading ? (
            <div className="h-5 w-20 bg-slate-200 rounded-md animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* User Identity & Role Badge */}
              <div className="flex items-center space-x-2 rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 sm:px-3 py-1.5 backdrop-blur-md shadow-xs">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-medium text-slate-700 max-w-[85px] xs:max-w-[130px] sm:max-w-[200px] md:max-w-none truncate font-sans">
                  {user.name || user.email}
                </span>
                <span
                  id="navbar-user-role-badge"
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200 font-mono shadow-xs'
                      : 'bg-slate-200 text-slate-700 border border-slate-300 font-mono'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              {/* Logout Button */}
              <button
                id="navbar-logout-btn"
                type="button"
                onClick={() => logout()}
                className="rounded-xl border border-rose-200 bg-rose-50/90 px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope text-rose-600 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2 text-xs font-semibold font-manrope text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 px-3 sm:px-4 py-2 text-xs font-semibold font-manrope text-white shadow-sm hover:brightness-110 transition-all"
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
