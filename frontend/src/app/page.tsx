'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 lg:px-16 font-sans text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl space-y-8"
        >
          {/* Centered Brand Logo */}
          <div className="flex items-center justify-center space-x-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1px] shadow-[0_0_28px_rgba(99,102,241,0.45)]">
              <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#080a10]">
                <svg
                  className="h-6 w-6 text-indigo-400"
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
            <span className="text-3xl font-bold tracking-tight text-white font-sans">
              DevPulse
            </span>
          </div>

          {/* Centered Motto Heading */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-white leading-[1.12]">
            Where code meets{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 bg-clip-text text-transparent">
              collective intelligence.
            </span>
          </h1>

          {/* Centered Passage */}
          <p className="text-base sm:text-lg text-zinc-300 font-normal leading-relaxed max-w-xl mx-auto">
            A modern platform engineered for developers to exchange technical insights, debate architecture, and build the future of software together.
          </p>

          {/* Centered Action Buttons (Placed after the texts) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoading ? (
              <div className="h-12 w-48 rounded-2xl bg-white/10 animate-pulse" />
            ) : isAuthenticated && user ? (
              /* If already logged in, show Dashboard quick access */
              <div className="flex flex-col sm:flex-row items-center gap-3.5">
                <Link
                  href="/dashboard"
                  id="hero-dashboard-btn"
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] flex items-center space-x-2 border border-indigo-400/30 cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                  <span className="text-xs font-mono bg-black/20 px-2 py-0.5 rounded-md text-white/90">
                    {user.name || user.email}
                  </span>
                  <span>→</span>
                </Link>

                <Link
                  href="/login"
                  className="px-6 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-sm font-medium border border-white/10 backdrop-blur-xl transition-all"
                >
                  Switch Account
                </Link>
              </div>
            ) : (
              /* Public Call-To-Action: Sign In & Sign Up */
              <>
                {/* Sign In Button */}
                <Link
                  href="/login"
                  id="hero-signin-btn"
                  className="w-full sm:w-auto min-w-[170px] px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2.5 border border-indigo-400/30 cursor-pointer"
                >
                  <span>Sign In</span>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </Link>

                {/* Sign Up Button */}
                <Link
                  href="/signup"
                  id="hero-signup-btn"
                  className="w-full sm:w-auto min-w-[170px] px-8 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-sm font-semibold border border-white/15 hover:border-white/30 backdrop-blur-2xl shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Sign Up</span>
                  <span className="text-zinc-400 font-normal">→</span>
                </Link>
              </>
            )}
          </div>

          {/* Subtle Feature Indicators */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Next.js 16 & NestJS</span>
            </div>
            <div className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span>JWT & Roles Authorization</span>
            </div>
            <div className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span>MongoDB Atlas</span>
            </div>
          </div>
        </motion.div>
      </div>
    </MeshGradientBackground>
  );
}
