'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX, FiLogOut, FiUser, FiGrid, FiUsers, FiShield, FiActivity } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  // Sourced from TanStack Query-managed useCurrentUser cache via AuthProvider
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Hide navbar on public landing and auth pages (root, login, signup) to prevent duplication
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const userInitial = (user?.name || user?.email || 'U')[0].toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090d16]/95 backdrop-blur-xl shadow-lg overflow-x-clip">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6 lg:px-12">
        
        {/* Left: Brand Logo & Desktop Nav */}
        <div className="flex items-center space-x-3 sm:space-x-6 min-w-0">
          <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3 group shrink-0">
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
            <span className="text-base sm:text-lg font-bold font-manrope tracking-tight text-white">
              DevPulse
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden sm:flex items-center space-x-1">
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold font-manrope transition-colors ${
                    pathname.startsWith('/dashboard')
                      ? 'bg-white/10 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  id="navbar-profile-link"
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold font-manrope transition-colors ${
                    pathname.startsWith('/profile')
                      ? 'bg-white/10 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  Profile
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/users"
                    id="navbar-admin-users-link"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold font-manrope transition-colors ${
                      pathname.startsWith('/admin')
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                    }`}
                  >
                    User List
                  </Link>
                )}
                <Link
                  href="/status"
                  id="navbar-status-link"
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold font-manrope transition-colors ${
                    pathname === '/status'
                      ? 'bg-white/10 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  Status
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right: Auth Status & Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {isLoading ? (
            <div className="h-6 w-20 bg-white/5 rounded-md animate-pulse" />
          ) : isAuthenticated && user ? (
            <>
              {/* Desktop View (>= sm): User Pill with Full Name and Role + Logout Button */}
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  href="/profile"
                  id="navbar-user-badge-link"
                  className="flex items-center space-x-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 backdrop-blur-md shadow-xs transition-colors group cursor-pointer"
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-xs font-medium text-zinc-200 group-hover:text-white font-sans">
                    {user.name || user.email}
                  </span>
                  <span
                    id="navbar-user-role-badge"
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full font-mono shrink-0 ${
                      user.role === 'admin'
                        ? 'bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-emerald-500/30 text-indigo-300 border border-indigo-400/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </Link>

                <button
                  id="navbar-logout-btn"
                  type="button"
                  onClick={() => logout()}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold font-manrope text-red-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-200 transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
                >
                  Logout
                </button>
              </div>

              {/* Mobile View (< sm): Compact Avatar Dot Link + Hamburger Menu Toggle */}
              <div className="flex sm:hidden items-center space-x-2">
                <Link
                  href="/profile"
                  title="My Profile"
                  className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 p-[1px] shadow-xs active:scale-95 transition-transform"
                >
                  <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0c101c] text-white font-bold text-xs">
                    {userInitial}
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#090d16]" />
                </Link>

                {/* Mobile Menu Toggle Button */}
                <button
                  id="navbar-mobile-toggle-btn"
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  {mobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold font-manrope text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold font-manrope text-white shadow-[0_0_16px_rgba(99,102,241,0.3)] hover:shadow-[0_0_22px_rgba(99,102,241,0.5)] hover:brightness-110 transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Dropdown (< sm) */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-[#090d16]/98 px-3.5 py-4 space-y-3 backdrop-blur-2xl shadow-2xl max-w-full overflow-hidden">
          
          {/* User Profile Card: FULL NAME without any truncation */}
          {user && (
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors group cursor-pointer"
            >
              <div className="relative h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 p-[1px] shrink-0 shadow-md">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0c101c] text-white font-bold text-sm">
                  {userInitial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#090d16]" />
              </div>

              <div className="min-w-0 flex-1 space-y-1 text-left">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold font-manrope text-white break-words group-hover:text-indigo-200 transition-colors">
                    {user.name || user.email}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full font-mono shrink-0 ${
                      user.role === 'admin'
                        ? 'bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-emerald-500/30 text-indigo-300 border border-indigo-400/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono break-all leading-tight">
                  {user.email}
                </p>
              </div>
            </Link>
          )}

          {/* Navigation Links with Icons */}
          <div className="space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2.5 min-h-[44px] rounded-xl px-3.5 py-2.5 text-xs font-semibold font-manrope transition-colors ${
                pathname.startsWith('/dashboard')
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <FiGrid className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2.5 min-h-[44px] rounded-xl px-3.5 py-2.5 text-xs font-semibold font-manrope transition-colors ${
                pathname.startsWith('/profile')
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <FiUser className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>My Profile</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                href="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 min-h-[44px] rounded-xl px-3.5 py-2.5 text-xs font-semibold font-manrope transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <FiUsers className="h-4 w-4 text-purple-400 shrink-0" />
                <span>User List</span>
              </Link>
            )}

            <Link
              href="/status"
              id="navbar-mobile-status-link"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-2.5 min-h-[44px] rounded-xl px-3.5 py-2.5 text-xs font-semibold font-manrope transition-colors ${
                pathname === '/status'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <FiActivity className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>System Status</span>
            </Link>
          </div>

          {/* Full-Width Mobile Logout Button */}
          <div className="pt-1 border-t border-white/10">
            <button
              id="navbar-mobile-logout-btn"
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 font-semibold font-manrope text-xs transition-all active:scale-98 cursor-pointer shadow-xs"
            >
              <FiLogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
