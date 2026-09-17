'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  FiCamera,
  FiTrash2,
  FiAlertCircle,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import {
  useUserProfile,
  useUpdateAvatarMutation,
  useDeleteAvatarMutation,
} from './users.api';
import { ProfileSkeleton } from './ProfileSkeleton';
import { compressImage } from '@/lib/image';
import { formatExpDate, getInitials } from '@/lib/formatters';

interface ProfileViewProps {
  targetId?: string;
}

export function ProfileView({ targetId = 'me' }: ProfileViewProps) {
  const isOwn = !targetId || targetId === 'me';
  const { user: currentUser, isLoading: authLoading } = useAuth();

  // TanStack Query Profile Data
  const {
    data: profile,
    isLoading: loading,
    error: queryError,
  } = useUserProfile(targetId);

  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : 'Failed to load profile'
    : null;

  const [copied, setCopied] = useState(false);

  // TanStack Query Avatar Mutations
  const updateAvatarMutation = useUpdateAvatarMutation(targetId);
  const deleteAvatarMutation = useDeleteAvatarMutation(targetId);
  const avatarUploading =
    updateAvatarMutation.isPending || deleteAvatarMutation.isPending;

  const [avatarToast, setAvatarToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileId = profile?.id || profile?._id || targetId;
  const isOwner = isOwn || (currentUser && currentUser.id === profileId);
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = Boolean(isOwner || isAdmin);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/developers/${profileId}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Avatar Upload Handler with shared image compression
  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarToast({
        type: 'error',
        message: 'Please select a valid image file (PNG, JPG, WebP)',
      });
      setTimeout(() => setAvatarToast(null), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarToast({
        type: 'error',
        message: 'Image size should be less than 5MB',
      });
      setTimeout(() => setAvatarToast(null), 3000);
      return;
    }

    setAvatarToast(null);

    try {
      const dataUrl = await compressImage(file, 400, 0.88);
      await updateAvatarMutation.mutateAsync(dataUrl);
      setAvatarToast({
        type: 'success',
        message: 'Profile picture updated successfully!',
      });
      setTimeout(() => setAvatarToast(null), 3000);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to update avatar';
      setAvatarToast({ type: 'error', message: msg });
      setTimeout(() => setAvatarToast(null), 3500);
    }
  };

  // Remove Avatar Handler
  const handleRemoveAvatar = async () => {
    if (!profile) return;
    try {
      await deleteAvatarMutation.mutateAsync();
      setAvatarToast({
        type: 'success',
        message: 'Profile picture removed. Initials restored.',
      });
      setTimeout(() => setAvatarToast(null), 3000);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to remove avatar';
      setAvatarToast({ type: 'error', message: msg });
      setTimeout(() => setAvatarToast(null), 3500);
    }
  };

  if (loading || authLoading) {
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
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] text-white px-5 py-2.5 text-xs font-semibold font-manrope transition-all shadow-md"
              >
                <span>Sign In to DevPulse</span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] text-white px-5 py-2.5 text-xs font-semibold font-manrope transition-all shadow-md"
              >
                <span>Return to Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const initials = getInitials(profile.name);

  const memberSince = profile.createdAt
    ? (() => {
        const d = new Date(profile.createdAt);
        const day = d.getDate();
        const month = d.toLocaleDateString('en-US', { month: 'long' });
        const year = d.getFullYear();
        return `${day} ${month} , ${year}`;
      })()
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
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1.5 sm:space-x-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/70 rounded-xl px-3 sm:px-3.5 py-2 backdrop-blur-md shadow-xs transition-all"
            >
              <FiArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>

            <div className="flex items-center space-x-2 sm:space-x-2.5">
              <button
                type="button"
                onClick={handleShare}
                id="share-profile-btn"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/70 rounded-xl px-3 sm:px-3.5 py-2 backdrop-blur-md shadow-xs transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <FiCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <FiShare2 className="h-3.5 w-3.5" />
                    <span className="hidden min-[380px]:inline">Share Profile</span>
                    <span className="min-[380px]:hidden">Share</span>
                  </>
                )}
              </button>

              {canEdit && (
                <Link
                  href="/profile/edit"
                  id="edit-profile-btn"
                  className="inline-flex items-center space-x-1.5 sm:space-x-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] text-white px-3 sm:px-4 py-2 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-indigo-500/40 transition-all cursor-pointer"
                >
                  <FiEdit3 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Edit Profile</span>
                </Link>
              )}
            </div>
          </div>

          {/* Feedback Toasts for Avatar */}
          <AnimatePresence>
            {avatarToast && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`p-3.5 rounded-2xl text-xs font-medium font-sans flex items-center justify-between border backdrop-blur-md ${
                  avatarToast.type === 'success'
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50/90 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {avatarToast.type === 'success' ? (
                    <FiCheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <FiAlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{avatarToast.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAvatarToast(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-0.5"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* HERO IDENTITY CARD */}
          <div className="rounded-3xl border border-white/80 bg-white/75 p-6 sm:p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl relative overflow-hidden">
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 w-full md:w-auto">
                
                {/* Avatar with Camera Overlay */}
                <div className="relative group shrink-0">
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden shadow-md ring-4 ring-white/90 transition-transform group-hover:scale-[1.02]">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center text-white font-bold font-manrope text-2xl sm:text-3xl shadow-inner">
                        {initials}
                      </div>
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
                        <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Attached Frosted White Glass Action Buttons */}
                  {canEdit && (
                    <div className="absolute -bottom-2 -right-2 flex items-center gap-1.5 z-20">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        title={avatarUploading ? "Uploading..." : "Change profile picture"}
                        aria-label="Change profile picture"
                        className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-indigo-600 border border-white/90 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.2)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer group/btn"
                      >
                        <FiCamera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 group-hover/btn:text-indigo-600 transition-colors" />
                      </button>

                      {profile.avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={avatarUploading}
                          title="Remove picture"
                          aria-label="Remove picture"
                          className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full bg-white/85 hover:bg-white text-slate-400 hover:text-rose-600 border border-white/90 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.2)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer group/del"
                        >
                          <FiTrash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 group-hover/del:text-rose-600 transition-colors" />
                        </button>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </div>

                {/* User Info Details */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-bold font-manrope tracking-tight text-slate-900">
                      {profile.name}
                    </h1>
                    {profile.role === 'admin' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-manrope bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                        <FiShield className="h-3 w-3" />
                        <span>Admin</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium font-sans text-indigo-600">
                    {profile.title || 'Senior Software Engineer'}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500 font-sans pt-1">
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

              {/* Engagement Stats Pills */}
              <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="flex-1 md:flex-initial text-center px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 shadow-2xs">
                  <div className="flex items-center justify-center space-x-1 text-slate-400 mb-1">
                    <FiHeart className="h-3.5 w-3.5 text-rose-500" />
                    <span className="text-[11px] font-medium font-manrope text-slate-500">Reactions</span>
                  </div>
                  <div className="text-lg font-bold font-manrope text-slate-900">
                    {profile.reactionsCount ?? 0}
                  </div>
                </div>

                <div className="flex-1 md:flex-initial text-center px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 shadow-2xs">
                  <div className="flex items-center justify-center space-x-1 text-slate-400 mb-1">
                    <FiFileText className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-[11px] font-medium font-manrope text-slate-500">Posts</span>
                  </div>
                  <div className="text-lg font-bold font-manrope text-slate-900">
                    {profile.postsCount ?? 0}
                  </div>
                </div>

                <div className="flex-1 md:flex-initial text-center px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 shadow-2xs">
                  <div className="flex items-center justify-center space-x-1 text-slate-400 mb-1">
                    <FiTrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[11px] font-medium font-manrope text-slate-500">Ranked</span>
                  </div>
                  <div className="text-lg font-bold font-manrope text-slate-900">
                    {profile.topRankedCount ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TWO COLUMN CONTENT SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column: Skills Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-3xl border border-white/80 bg-white/75 p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FiAward className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold font-manrope text-slate-900">
                      Technical Skills
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold font-manrope text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {profile.skills?.length || 0}
                  </span>
                </div>

                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold font-manrope bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 font-sans space-y-2">
                    <p>No technical skills listed yet.</p>
                    {canEdit && (
                      <Link
                        href="/profile/edit"
                        className="inline-block text-indigo-600 hover:underline font-semibold"
                      >
                        + Add Skills in Edit
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Work Experience Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-white/80 bg-white/75 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FiBriefcase className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold font-manrope text-slate-900">
                      Work Experience
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold font-manrope text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {profile.experiences?.length || 0} Positions
                  </span>
                </div>

                {profile.experiences && profile.experiences.length > 0 ? (
                  <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {profile.experiences.map((exp, idx) => (
                      <div key={exp._id || exp.id || idx} className="relative group">
                        {/* Dot on timeline */}
                        <div className="absolute -left-6 top-1.5 h-4 w-4 rounded-full border-2 border-white bg-indigo-600 shadow-xs transition-transform group-hover:scale-125" />

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <h4 className="text-sm font-bold font-manrope text-slate-900">
                              {exp.title}
                            </h4>
                            <span className="text-[11px] font-medium font-manrope text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {formatExpDate(exp.from)} — {formatExpDate(exp.to)}
                            </span>
                          </div>

                          <div className="text-xs font-semibold font-sans text-indigo-600">
                            {exp.company}
                          </div>

                          {exp.description && (
                            <p className="text-xs font-sans text-slate-600 leading-relaxed pt-1">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-xs text-slate-400 font-sans space-y-2">
                    <p>No work experience entries recorded.</p>
                    {canEdit && (
                      <Link
                        href="/profile/edit"
                        className="inline-block text-indigo-600 hover:underline font-semibold"
                      >
                        + Add Work Experience in Edit
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
