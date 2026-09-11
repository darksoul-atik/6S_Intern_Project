'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiLogIn, FiUserPlus, FiArrowRight, FiLayout } from 'react-icons/fi';
import { MeshGradientBackground } from '@/components/MeshGradientBackground';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

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
          <div className="flex items-center justify-center space-x-3 sm:space-x-3.5">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-[0_0_28px_rgba(99,102,241,0.45)]">
              <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#080a10]">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400"
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
            <span className="text-2xl sm:text-3xl font-bold font-manrope tracking-tight text-white">
              DevPulse
            </span>
          </div>

          {/* Centered Motto Heading */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold font-manrope tracking-tight text-white leading-[1.12]">
            Where code meets{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
              collective intelligence.
            </span>
          </h1>

          {/* Centered Passage */}
          <p className="text-sm sm:text-base md:text-lg text-zinc-300 font-sans font-normal leading-relaxed max-w-xl mx-auto px-2">
            A modern platform engineered for developers to exchange technical insights, debate architecture, and build the future of software together.
          </p>

          {/* Centered Action Buttons (Placed directly after the texts) */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
            {isLoading ? (
              <div className="h-12 w-48 rounded-2xl bg-white/10 animate-pulse mx-auto" />
            ) : isAuthenticated && user ? (
              /* If already logged in, show Dashboard quick access */
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 w-full sm:w-auto">
                <Link
                  href="/dashboard"
                  id="hero-dashboard-btn"
                  className="group px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-semibold font-manrope shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2.5 border border-indigo-400/30 cursor-pointer"
                >
                  <FiLayout className="h-4 w-4 text-emerald-200" />
                  <span>Go to Dashboard</span>
                  <span className="text-xs font-mono bg-black/25 px-2 py-0.5 rounded-md text-white/90">
                    {user.name || user.email}
                  </span>
                  <FiArrowRight className="h-4 w-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="px-6 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold font-manrope border border-white/10 backdrop-blur-xl transition-all text-center"
                >
                  Switch Account
                </Link>
              </div>
            ) : (
              /* Public Call-To-Action: Sign In & Sign Up with React Icons */
              <>
                {/* Sign In Button */}
                <Link
                  href="/login"
                  id="hero-signin-btn"
                  className="group w-full sm:w-auto min-w-[160px] sm:min-w-[170px] px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold font-manrope shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2.5 border border-indigo-400/30 cursor-pointer"
                >
                  <FiLogIn className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  <span>Sign In</span>
                </Link>

                {/* Sign Up Button */}
                <Link
                  href="/signup"
                  id="hero-signup-btn"
                  className="group w-full sm:w-auto min-w-[160px] sm:min-w-[170px] px-6 sm:px-8 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs sm:text-sm font-semibold font-manrope border border-white/15 hover:border-white/30 backdrop-blur-2xl shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2.5 cursor-pointer"
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
