'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiLogIn, FiUserPlus, FiArrowRight, FiLogOut } from 'react-icons/fi';
import { MeshGradientBackground } from '@/components/ui/mesh-gradient-background';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <MeshGradientBackground
      colors={['#4f46e5', '#7c3aed', '#0284c7', '#059669']}
      speed={14}
      blur={130}
      interactive
    >
      <div className="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-16 py-8 sm:py-12 font-sans text-center overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl space-y-6 sm:space-y-8"
        >
          {/* Centered Brand Logo */}
          <div className="flex items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="DevPulse Logo"
              width={628}
              height={281}
              priority
              className="h-12 min-[380px]:h-14 sm:h-16 md:h-20 w-auto object-contain drop-shadow-[0_0_28px_rgba(251,191,36,0.3)] transition-transform duration-300 hover:scale-105"
            />
          </div>


          {/* Centered Motto Heading */}
          <h1 className="text-2xl min-[380px]:text-3xl sm:text-5xl md:text-6xl font-bold font-manrope tracking-tight text-white leading-[1.14]">
            Where code meets{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
              collective intelligence.
            </span>
          </h1>

          {/* Centered Passage */}
          <p className="text-xs min-[380px]:text-sm sm:text-base md:text-lg text-zinc-300 font-sans font-normal leading-relaxed max-w-xl mx-auto px-2 sm:px-4">
            A modern platform engineered for developers to exchange technical insights, debate architecture, and build the future of software together.
          </p>

          {/* Action Buttons: Continue As + Logout (if logged in) OR Sign In & Sign Up (if logged out) */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-lg mx-auto">
            {isLoading ? (
              <div className="h-14 w-64 rounded-2xl bg-white/10 backdrop-blur-md animate-pulse mx-auto" />
            ) : isAuthenticated && user ? (
              /* Authenticated View: Continue as User/Admin (with Avatar) + Logout */
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 w-full">
                {/* Continue as User / Admin Button */}
                <Link
                  href="/dashboard"
                  id="hero-continue-btn"
                  className="group flex-1 px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-semibold font-manrope shadow-lg shadow-indigo-600/35 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] flex items-center justify-between space-x-3 border border-indigo-400/40 cursor-pointer min-w-0"
                >
                  <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                    {/* User Avatar Placeholder */}
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-white/20 border border-white/30 text-white font-bold font-manrope text-xs sm:text-sm shadow-inner group-hover:scale-105 transition-transform">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-emerald-200 font-semibold block leading-tight">
                        {user.role === 'admin' ? 'Admin Access' : 'Verified User'}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-white block leading-snug break-words">
                        Continue as {user.name || user.email.split('@')[0]}
                      </span>
                    </div>
                  </div>
                  <FiArrowRight className="h-4 w-4 shrink-0 text-white/90 group-hover:translate-x-1 transition-transform ml-2" />
                </Link>

                {/* Log Out Button */}
                <button
                  id="hero-logout-btn"
                  type="button"
                  onClick={logout}
                  className="group px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white/[0.08] hover:bg-rose-500/20 text-zinc-300 hover:text-rose-200 text-xs sm:text-sm font-semibold font-manrope border border-white/15 hover:border-rose-500/30 backdrop-blur-2xl shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer shrink-0"
                >
                  <FiLogOut className="h-4 w-4 text-zinc-400 group-hover:text-rose-300 transition-colors" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              /* Public View: Sign In & Sign Up */
              <>
                {/* Sign In Button */}
                <Link
                  href="/login"
                  id="hero-signin-btn"
                  className="group w-full sm:w-auto min-w-[140px] sm:min-w-[170px] px-5 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold font-manrope shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2.5 border border-indigo-400/30 cursor-pointer"
                >
                  <FiLogIn className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  <span>Sign In</span>
                </Link>

                {/* Sign Up Button */}
                <Link
                  href="/signup"
                  id="hero-signup-btn"
                  className="group w-full sm:w-auto min-w-[140px] sm:min-w-[170px] px-5 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs sm:text-sm font-semibold font-manrope border border-white/15 hover:border-white/30 backdrop-blur-2xl shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2.5 cursor-pointer"
                >
                  <FiUserPlus className="h-4 w-4 text-indigo-300" />
                  <span>Sign Up</span>
                  <FiArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </MeshGradientBackground>
  );
}
