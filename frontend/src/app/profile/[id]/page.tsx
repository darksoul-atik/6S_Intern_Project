'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiAward,
  FiBriefcase,
  FiCalendar,
  FiMail,
  FiEdit3,
  FiArrowLeft,
  FiShare2,
  FiCheck,
  FiHeart,
  FiFileText,
  FiTrendingUp,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/lib/api';
import type { UserProfile } from '@/types/profile';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProfileViewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const targetId = resolvedParams.id;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const endpoint =
          targetId === 'me' ? '/api/users/me' : `/api/users/${targetId}`;
        const res = await apiClient<UserProfile>(endpoint);
        if (active && res.data) {
          setProfile(res.data);
        }
      } catch (err) {
        if (active) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('Failed to load profile');
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      active = false;
    };
  }, [targetId]);

  const profileId =
    profile?.id || profile?._id || (targetId !== 'me' ? targetId : currentUser?.id);
  const isOwner =
    currentUser && (currentUser.id === profileId || targetId === 'me');
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = Boolean(isOwner || isAdmin);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = profileId
        ? `${window.location.origin}/profile/${profileId}`
        : window.location.href;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    const is401 =
      error?.includes('401') ||
      error?.toLowerCase().includes('unauthorized') ||
      error?.toLowerCase().includes('active session');
    const is404 =
      error?.includes('404') || error?.toLowerCase().includes('not found');
    const is403 =
      error?.includes('403') ||
      error?.toLowerCase().includes('permission') ||
      error?.toLowerCase().includes('forbidden');

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center backdrop-blur-2xl shadow-xl space-y-4">
          <div
            className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold font-mono shadow-sm ${
              is401
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : is403
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            {is401 ? '401' : is403 ? '403' : is404 ? '404' : '!'}
          </div>
          <h2 className="text-xl font-bold font-manrope text-slate-900">
            {is401
              ? 'Authentication Required'
              : is403
              ? 'Access Forbidden'
              : is404
              ? 'Developer Not Found'
              : 'Profile Unavailable'}
          </h2>
          <p className="text-sm text-slate-600 font-sans leading-relaxed">
            {is401
              ? 'Please sign in to your DevPulse account to view this profile.'
              : is403
              ? 'You do not have authorization to access this profile data.'
              : is404
              ? 'The requested developer profile does not exist or has been removed.'
              : error || 'Unable to load profile at this time.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {is401 ? (
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-xs font-semibold hover:bg-indigo-500 transition-all shadow-xs"
              >
                <span>Sign In to DevPulse</span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 text-white px-5 py-2.5 text-xs font-semibold hover:bg-slate-800 transition-all shadow-xs"
              >
                <FiArrowLeft className="h-4 w-4" />
                <span>Return to Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const initials = profile.name
    ? profile.name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'DP';

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Dot Texture */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none"
        aria-hidden="true"
      />

      {/* Radiant Glow Orbs */}
      <div
        className="absolute top-12 left-1/4 -translate-x-1/2 w-[550px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-300/35 via-blue-200/25 to-transparent blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-28 right-1/4 translate-x-1/3 w-[600px] h-[520px] rounded-full bg-gradient-to-bl from-purple-300/35 via-violet-200/25 to-transparent blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/70 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-xs transition-all"
            >
              <FiArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={handleShare}
                id="share-profile-btn"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/70 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-xs transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <FiCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <FiShare2 className="h-3.5 w-3.5" />
                    <span>Share Profile</span>
                  </>
                )}
              </button>

              {canEdit && (
                <Link
                  href={`/profile/${profileId}/edit`}
                  id="edit-profile-btn"
                  className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white px-4 py-2 text-xs font-semibold font-manrope shadow-[0_4px_16px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_22px_rgba(79,70,229,0.45)] transition-all cursor-pointer"
                >
                  <FiEdit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </Link>
              )}
            </div>
          </div>

          {/* Profile Hero Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl border border-white/80 bg-white/65 p-6 sm:p-8 md:p-10 backdrop-blur-3xl backdrop-saturate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8),inset_0_1px_2px_rgba(255,255,255,0.95)] overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95" />
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar Ring */}
              <div className="relative group">
                <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 p-[2px] shadow-[0_8px_30px_rgba(99,102,241,0.35)] overflow-hidden">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="h-full w-full object-cover rounded-[22px]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-slate-900 text-white font-mono font-bold text-2xl sm:text-3xl tracking-wider">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              </div>

              {/* Developer Info */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-manrope tracking-tight text-slate-900">
                    {profile.name}
                  </h1>

                  <span
                    id="profile-role-badge"
                    className={`text-[11px] uppercase font-bold font-mono tracking-wider px-3 py-1 rounded-full ${
                      profile.role === 'admin'
                        ? 'bg-purple-100/90 text-purple-700 border border-purple-300/80 shadow-[0_0_12px_rgba(147,51,234,0.15)]'
                        : 'bg-indigo-100/90 text-indigo-700 border border-indigo-300/80 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                    }`}
                  >
                    {profile.role}
                  </span>
                </div>

                {profile.title && (
                  <p className="text-sm sm:text-base font-semibold text-indigo-600 font-manrope">
                    {profile.title}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-sans pt-0.5">
                  {profile.email && (
                    <div className="flex items-center space-x-1.5">
                      <FiMail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {memberSince && (
                    <div className="flex items-center space-x-1.5">
                      <FiCalendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Member since {memberSince}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* DaisyUI-Themed Community Impact Stats Component */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="stats shadow-sm w-full rounded-3xl border border-white/80 bg-white/65 p-2 sm:p-3 backdrop-blur-3xl backdrop-saturate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100/90"
          >
            {/* Stat 1: Reactions */}
            <div className="stat flex items-center justify-between p-4 sm:p-6">
              <div>
                <div className="stat-title text-xs font-bold uppercase tracking-wider text-slate-400 font-manrope">
                  Reactions Received
                </div>
                <div className="stat-value text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900 mt-1">
                  {profile.reactionsCount || 0}
                </div>
                <div className="stat-desc text-[11px] text-slate-500 font-sans mt-0.5">
                  Across all community posts
                </div>
              </div>
              <div className="stat-figure text-rose-500 bg-rose-50 p-3 rounded-2xl border border-rose-100/80 shadow-2xs">
                <FiHeart className="h-6 w-6 stroke-current" />
              </div>
            </div>

            {/* Stat 2: Posts Made */}
            <div className="stat flex items-center justify-between p-4 sm:p-6">
              <div>
                <div className="stat-title text-xs font-bold uppercase tracking-wider text-slate-400 font-manrope">
                  Posts Published
                </div>
                <div className="stat-value text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900 mt-1">
                  {profile.postsCount || 0}
                </div>
                <div className="stat-desc text-[11px] text-slate-500 font-sans mt-0.5">
                  Technical articles & discussions
                </div>
              </div>
              <div className="stat-figure text-indigo-600 bg-indigo-50 p-3 rounded-2xl border border-indigo-100/80 shadow-2xs">
                <FiFileText className="h-6 w-6 stroke-current" />
              </div>
            </div>

            {/* Stat 3: #1 Ranked Posts */}
            <div className="stat flex items-center justify-between p-4 sm:p-6">
              <div>
                <div className="stat-title text-xs font-bold uppercase tracking-wider text-slate-400 font-manrope">
                  Ranked #1 Honors
                </div>
                <div className="stat-value text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900 mt-1">
                  {profile.topRankedCount || 0}
                </div>
                <div className="stat-desc text-[11px] text-slate-500 font-sans mt-0.5">
                  Leaderboard first-place victories
                </div>
              </div>
              <div className="stat-figure text-amber-500 bg-amber-50 p-3 rounded-2xl border border-amber-100/80 shadow-2xs">
                <FiTrendingUp className="h-6 w-6 stroke-current" />
              </div>
            </div>
          </motion.div>

          {/* Two-Column Grid: Skills & Work Experiences */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Skills Column (1 col) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1 rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-7 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] space-y-4"
            >
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <FiAward className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold font-manrope text-slate-900 tracking-tight">
                  Skills & Tech
                </h2>
              </div>

              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-xs font-medium font-mono text-slate-700 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-300 hover:text-indigo-600 transition-all"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <p className="text-xs text-slate-500 font-sans">
                    {canEdit
                      ? 'No skills listed yet.'
                      : 'This developer has not listed any skills yet.'}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Experiences Column (2 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] space-y-5"
            >
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                  <FiBriefcase className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold font-manrope text-slate-900 tracking-tight">
                  Work Experience
                </h2>
              </div>

              {profile.experiences && profile.experiences.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-indigo-400 before:via-purple-300 before:to-transparent">
                  {profile.experiences.map((exp) => (
                    <div key={exp._id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.5)] group-hover:scale-125 transition-transform" />

                      <div className="rounded-2xl border border-white/80 bg-white/70 p-4 sm:p-5 backdrop-blur-md shadow-xs hover:shadow-md hover:border-indigo-200/80 transition-all space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm sm:text-base font-bold font-manrope text-slate-900">
                              {exp.title}
                            </h3>
                            <p className="text-xs font-semibold text-indigo-600">
                              {exp.company}
                            </p>
                          </div>
                          <span className="inline-flex items-center space-x-1 rounded-lg bg-slate-100/80 px-2.5 py-1 text-[11px] font-mono font-medium text-slate-600">
                            <FiCalendar className="h-3 w-3 text-slate-400" />
                            <span>
                              {exp.from} – {exp.to || 'Present'}
                            </span>
                          </span>
                        </div>

                        {exp.description && (
                          <p className="text-xs text-slate-600 leading-relaxed pt-1">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <p className="text-xs text-slate-500 font-sans">
                    {canEdit
                      ? 'No work experience listed yet.'
                      : 'This developer has not listed any work experience yet.'}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
