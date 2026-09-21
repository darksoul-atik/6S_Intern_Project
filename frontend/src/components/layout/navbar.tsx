"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiActivity,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiRss,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const mobileMenuOpen = mobileMenuPath === pathname;

  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const userInitial = (user?.name || user?.email || "U")[0].toUpperCase();
  const isFeedActive = pathname.startsWith("/posts");

  return (
    <header className="sticky top-0 z-50 w-full overflow-x-clip border-b border-white/10 bg-[#090d16]/95 shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6 lg:px-12">
        {/* Left Side */}
        <div className="flex min-w-0 items-center space-x-3 sm:space-x-6">
          <Link
            href={ROUTES.DASHBOARD}
            className="group flex shrink-0 items-center focus:outline-hidden"
            aria-label="DevPulse Dashboard"
          >
            <Image
              src="/images/logo.png"
              alt="DevPulse Logo"
              width={628}
              height={281}
              priority
              className="h-7 w-auto object-contain transition-transform group-hover:scale-105 sm:h-8 md:h-9"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-1 sm:flex">
            <Link
              href={ROUTES.POSTS}
              id="navbar-feed-link"
              className={`rounded-lg px-3 py-1.5 font-manrope text-xs font-semibold transition-colors ${
                isFeedActive
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              Feed
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href={ROUTES.DASHBOARD}
                  className={`rounded-lg px-3 py-1.5 font-manrope text-xs font-semibold transition-colors ${
                    pathname.startsWith("/dashboard")
                      ? "bg-white/10 text-white shadow-xs"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  Dashboard
                </Link>

                <Link
                  href={ROUTES.PROFILE}
                  id="navbar-profile-link"
                  className={`rounded-lg px-3 py-1.5 font-manrope text-xs font-semibold transition-colors ${
                    pathname.startsWith("/profile")
                      ? "bg-white/10 text-white shadow-xs"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  Profile
                </Link>

                {user?.role === "admin" && (
                  <Link
                    href={ROUTES.ADMIN_USERS}
                    id="navbar-admin-users-link"
                    className={`rounded-lg px-3 py-1.5 font-manrope text-xs font-semibold transition-colors ${
                      pathname.startsWith("/admin")
                        ? "border border-indigo-500/30 bg-indigo-600/20 text-indigo-300 shadow-xs"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    }`}
                  >
                    User List
                  </Link>
                )}

                <Link
                  href={ROUTES.STATUS}
                  id="navbar-status-link"
                  className={`rounded-lg px-3 py-1.5 font-manrope text-xs font-semibold transition-colors ${
                    pathname === "/status"
                      ? "bg-white/10 text-white shadow-xs"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  Status
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex shrink-0 items-center space-x-2">
          {isLoading ? (
            <div className="h-6 w-20 animate-pulse rounded-md bg-white/5" />
          ) : isAuthenticated && user ? (
            <>
              {/* Desktop Authenticated Controls */}
              <div className="hidden items-center space-x-3 sm:flex">
                <Link
                  href={ROUTES.PROFILE}
                  id="navbar-user-badge-link"
                  className="group flex cursor-pointer items-center space-x-2 rounded-xl border border-white/10 bg-white/4 px-3 py-1.5 shadow-xs backdrop-blur-md transition-colors hover:bg-white/8"
                >
                  <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400" />
                  <span className="font-sans text-xs font-medium text-zinc-200 group-hover:text-white">
                    {user.name || user.email}
                  </span>
                  <span
                    id="navbar-user-role-badge"
                    className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                      user.role === "admin"
                        ? "border-indigo-400/30 bg-linear-to-r from-indigo-500/30 via-purple-500/30 to-emerald-500/30 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                        : "border-zinc-700 bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </Link>

                <button
                  id="navbar-logout-btn"
                  type="button"
                  onClick={() => logout()}
                  className="shrink-0 cursor-pointer rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 font-manrope text-xs font-semibold text-red-300 shadow-xs transition-all hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-200 active:scale-95"
                >
                  Logout
                </button>
              </div>

              {/* Mobile Authenticated Controls */}
              <div className="flex items-center space-x-2 sm:hidden">
                <Link
                  href={ROUTES.PROFILE}
                  title="My Profile"
                  className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-emerald-500 p-px shadow-xs transition-transform active:scale-95"
                >
                  <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0c101c] text-xs font-bold text-white">
                    {userInitial}
                  </div>
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#090d16] bg-emerald-400" />
                </Link>

                <button
                  id="navbar-mobile-toggle-btn"
                  type="button"
                  onClick={() =>
                    setMobileMenuPath(mobileMenuOpen ? null : pathname)
                  }
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {mobileMenuOpen ? (
                    <FiX className="h-5 w-5" />
                  ) : (
                    <FiMenu className="h-5 w-5" />
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Logged-out Controls */
            <div className="flex items-center space-x-2">
              <Link
                href={ROUTES.POSTS}
                className={`rounded-xl px-2.5 py-1.5 font-manrope text-xs font-semibold transition-all sm:hidden ${
                  isFeedActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Feed
              </Link>
              <Link
                href={ROUTES.LOGIN}
                className="rounded-xl border border-white/10 bg-white/4 px-2.5 py-1.5 font-manrope text-xs font-semibold text-zinc-300 transition-all hover:bg-white/8 hover:text-white sm:px-4 sm:py-2"
              >
                Sign In
              </Link>
              <Link
                href={ROUTES.SIGNUP}
                className="rounded-xl bg-linear-to-r from-indigo-600 to-emerald-500 px-2.5 py-1.5 font-manrope text-xs font-semibold text-white shadow-[0_0_16px_rgba(99,102,241,0.3)] transition-all hover:brightness-110 hover:shadow-[0_0_22px_rgba(99,102,241,0.5)] sm:px-4 sm:py-2"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="max-w-full space-y-3 overflow-hidden border-t border-white/10 bg-[#090d16]/98 px-3.5 py-4 shadow-2xl backdrop-blur-2xl sm:hidden">
          {user && (
            <Link
              href={ROUTES.PROFILE}
              onClick={() => setMobileMenuPath(null)}
              className="group flex cursor-pointer items-center space-x-3 rounded-2xl border border-white/10 bg-white/4 p-3 transition-colors hover:bg-white/8"
            >
              <div className="relative h-11 w-11 shrink-0 rounded-xl bg-linear-to-tr from-indigo-500 via-purple-500 to-emerald-400 p-px shadow-md">
                <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0c101c] text-sm font-bold text-white">
                  {userInitial}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#090d16] bg-emerald-400" />
              </div>

              <div className="min-w-0 flex-1 space-y-1 text-left">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="wrap-break-word font-manrope text-sm font-semibold text-white transition-colors group-hover:text-indigo-200">
                    {user.name || user.email}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                      user.role === "admin"
                        ? "border-indigo-400/30 bg-linear-to-r from-indigo-500/30 via-purple-500/30 to-emerald-500/30 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                        : "border-zinc-700 bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="break-all font-mono text-xs leading-tight text-zinc-400">
                  {user.email}
                </p>
              </div>
            </Link>
          )}

          <div className="space-y-1">
            <Link
              href={ROUTES.POSTS}
              id="navbar-mobile-feed-link"
              onClick={() => setMobileMenuPath(null)}
              className={`flex min-h-11 items-center space-x-2.5 rounded-xl px-3.5 py-2.5 font-manrope text-xs font-semibold transition-colors ${
                isFeedActive
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <FiRss className="h-4 w-4 shrink-0 text-indigo-400" />
              <span>Feed</span>
            </Link>

            <Link
              href={ROUTES.DASHBOARD}
              onClick={() => setMobileMenuPath(null)}
              className={`flex min-h-11 items-center space-x-2.5 rounded-xl px-3.5 py-2.5 font-manrope text-xs font-semibold transition-colors ${
                pathname.startsWith("/dashboard")
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <FiGrid className="h-4 w-4 shrink-0 text-indigo-400" />
              <span>Dashboard</span>
            </Link>

            <Link
              href={ROUTES.PROFILE}
              onClick={() => setMobileMenuPath(null)}
              className={`flex min-h-11 items-center space-x-2.5 rounded-xl px-3.5 py-2.5 font-manrope text-xs font-semibold transition-colors ${
                pathname.startsWith("/profile")
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <FiUser className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>My Profile</span>
            </Link>

            {user?.role === "admin" && (
              <Link
                href={ROUTES.ADMIN_USERS}
                onClick={() => setMobileMenuPath(null)}
                className={`flex min-h-11 items-center space-x-2.5 rounded-xl px-3.5 py-2.5 font-manrope text-xs font-semibold transition-colors ${
                  pathname.startsWith("/admin")
                    ? "border border-indigo-500/30 bg-indigo-600/20 text-indigo-300 shadow-xs"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <FiUsers className="h-4 w-4 shrink-0 text-purple-400" />
                <span>User List</span>
              </Link>
            )}

            <Link
              href={ROUTES.STATUS}
              id="navbar-mobile-status-link"
              onClick={() => setMobileMenuPath(null)}
              className={`flex min-h-11 items-center space-x-2.5 rounded-xl px-3.5 py-2.5 font-manrope text-xs font-semibold transition-colors ${
                pathname === "/status"
                  ? "bg-white/10 text-white shadow-xs"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <FiActivity className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>System Status</span>
            </Link>
          </div>

          <div className="border-t border-white/10 pt-1">
            <button
              id="navbar-mobile-logout-btn"
              type="button"
              onClick={() => {
                setMobileMenuPath(null);
                logout();
              }}
              className="flex w-full cursor-pointer items-center justify-center space-x-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 font-manrope text-xs font-semibold text-red-300 shadow-xs transition-all hover:bg-red-500/20 active:scale-98"
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
