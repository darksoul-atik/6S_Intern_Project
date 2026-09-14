'use client';

import { useEffect, useState, use, useRef } from 'react';
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
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/lib/api';
import type { UserProfile } from '@/types/profile';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatExpDate(val?: string): string {
  if (!val) return '';
  if (val.toLowerCase() === 'present') return 'Present';
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return val;
}

export default function ProfileViewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const targetId = resolvedParams.id;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Avatar Management State
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarToast, setAvatarToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Avatar Upload Handler
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

    setAvatarUploading(true);
    setAvatarToast(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        let dataUrl = '';
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        } else {
          dataUrl = event.target?.result as string;
        }

        try {
          const endpoint =
            targetId === 'me' ? '/api/users/me' : `/api/users/${profileId}`;
          const res = await apiClient<UserProfile>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify({ avatarUrl: dataUrl }),
          });
          if (res.data) {
            setProfile(res.data);
            setAvatarToast({
              type: 'success',
              message: 'Profile picture updated successfully!',
            });
            setTimeout(() => setAvatarToast(null), 3000);
          }
        } catch (err) {
          const msg =
            err instanceof ApiError ? err.message : 'Failed to update avatar';
          setAvatarToast({ type: 'error', message: msg });
          setTimeout(() => setAvatarToast(null), 3500);
        } finally {
          setAvatarUploading(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Remove Avatar Handler
  const handleRemoveAvatar = async () => {
    if (!profile) return;
    setAvatarUploading(true);
    try {
      const endpoint =
        targetId === 'me' ? '/api/users/me' : `/api/users/${profileId}`;
      const res = await apiClient<UserProfile>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl: '' }),
      });
      if (res.data) {
        setProfile(res.data);
        setAvatarToast({
          type: 'success',
          message: 'Profile picture removed. Initials restored.',
        });
        setTimeout(() => setAvatarToast(null), 3000);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to remove avatar';
      setAvatarToast({ type: 'error', message: msg });
      setTimeout(() => setAvatarToast(null), 3500);
    } finally {
      setAvatarUploading(false);
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
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] text-white px-5 py-2.5 text-xs font-semibold font-manrope transition-all shadow-md"
              >
                <span>Sign In to DevPulse</span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] text-white px-5 py-2.5 text-xs font-semibold font-manrope transition-all shadow-md"
              >
                <FiArrowLeft className="h-4 w-4 text-indigo-400" />
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
                  className="inline-flex items-center space-x-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] text-white px-4 py-2 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-indigo-500/40 transition-all cursor-pointer"
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
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center space-x-2.5 text-xs font-medium rounded-2xl p-3.5 border shadow-sm ${
                  avatarToast.type === 'success'
                    ? 'text-emerald-700 bg-emerald-50/90 border-emerald-200'
                    : 'text-rose-700 bg-rose-50/90 border-rose-200'
                }`}
              >
                {avatarToast.type === 'success' ? (
                  <FiCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{avatarToast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Hero Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl border border-white/80 bg-white/65 p-6 sm:p-8 md:p-10 backdrop-blur-3xl backdrop-saturate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8),inset_0_1px_2px_rgba(255,255,255,0.95)] overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95" />
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6">
              {/* Avatar Ring with Middle-Aligned Photo Controls */}
              <div className="flex flex-col items-center justify-center gap-2.5 shrink-0 self-center">
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

                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>

                  {/* Quick Upload Hover Button for Owner/Admin */}
                  {canEdit && (
                    <button
                      type="button"
                      disabled={avatarUploading}
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload or change profile picture"
                      className="absolute inset-0 rounded-3xl bg-black/45 backdrop-blur-[2px] text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer"
                    >
                      <FiCamera className="h-6 w-6 mb-1" />
                      <span className="text-[10px] font-semibold font-manrope">
                        {avatarUploading ? 'Updating...' : 'Change Photo'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Owner/Admin Action buttons centered directly under avatar matching image width */}
                {canEdit && (
                  <div className="flex items-center justify-between gap-2 w-24 sm:w-28 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    <button
                      type="button"
                      disabled={avatarUploading}
                      onClick={() => fileInputRef.current?.click()}
                      title={avatarUploading ? 'Uploading photo...' : 'Upload Photo'}
                      aria-label="Upload Photo"
                      className="flex-1 inline-flex items-center justify-center h-9 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] shadow-md hover:shadow-lg hover:border-indigo-500/40 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {avatarUploading ? (
                        <svg className="animate-spin h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                      ) : (
                        <FiCamera className="h-4 w-4 text-indigo-400" />
                      )}
                    </button>

                    {profile.avatarUrl && (
                      <button
                        type="button"
                        disabled={avatarUploading}
                        onClick={handleRemoveAvatar}
                        title="Remove Photo"
                        aria-label="Remove Photo"
                        className="flex-1 inline-flex items-center justify-center h-9 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] shadow-md hover:border-red-500/40 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <FiTrash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Developer Info */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
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

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 font-sans pt-0.5">
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

          {/* Two-Column Grid: Skills & Work Experiences (Clean View Route) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Skills Column (1 col) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] space-y-5"
            >
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <FiAward className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold font-manrope text-slate-900 tracking-tight">
                  Skills
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
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center space-y-2">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50/80 text-indigo-600 border border-indigo-100">
                    <FiAward className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-slate-500 font-sans">
                    {canEdit
                      ? 'No skills listed yet. Add your core competencies on the edit page.'
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
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <FiBriefcase className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold font-manrope text-slate-900 tracking-tight">
                  Work Experience
                </h2>
              </div>

              {profile.experiences && profile.experiences.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-indigo-400 before:via-purple-300 before:to-transparent">
                  {profile.experiences.map((exp) => (
                    <div key={exp._id || exp.id} className="relative group">
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
                              {formatExpDate(exp.from)} – {formatExpDate(exp.to)}
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
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50/80 text-indigo-600 border border-indigo-100">
                    <FiBriefcase className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-sans">
                    {canEdit
                      ? 'No work experience listed yet. Add your career milestones on the edit page.'
                      : 'This developer has not listed any work experience yet.'}
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Community Impact Stats Component (Under Skills & Experience, with matching text font, color and unified icon styling) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="stats shadow-sm w-full rounded-3xl border border-white/80 bg-white/65 p-2 sm:p-3 backdrop-blur-3xl backdrop-saturate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100/90"
          >
            {/* Stat 1: Reactions */}
            <div className="stat p-4 sm:p-6 space-y-2">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
                  <FiHeart className="h-4 w-4 stroke-current" />
                </div>
                <h3 className="text-base font-bold font-manrope text-slate-900 tracking-tight">
                  Reactions Received
                </h3>
              </div>
              <div className="pl-10.5">
                <div className="stat-value text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900">
                  {profile.reactionsCount || 0}
                </div>
                <div className="stat-desc text-[11px] text-slate-500 font-sans mt-0.5">
                  Across all community posts
                </div>
              </div>
            </div>

            {/* Stat 2: Posts Made */}
            <div className="stat p-4 sm:p-6 space-y-2">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
                  <FiFileText className="h-4 w-4 stroke-current" />
                </div>
                <h3 className="text-base font-bold font-manrope text-slate-900 tracking-tight">
                  Posts Published
                </h3>
              </div>
              <div className="pl-10.5">
                <div className="stat-value text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900">
                  {profile.postsCount || 0}
                </div>
                <div className="stat-desc text-[11px] text-slate-500 font-sans mt-0.5">
                  Technical articles & discussions
                </div>
              </div>
            </div>

            {/* Stat 3: #1 Ranked Posts */}
            <div className="stat p-4 sm:p-6 space-y-2">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
                  <FiTrendingUp className="h-4 w-4 stroke-current" />
                </div>
                <h3 className="text-base font-bold font-manrope text-slate-900 tracking-tight">
                  Ranked #1 Honors
                </h3>
              </div>
              <div className="pl-10.5">
                <div className="stat-value text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900">
                  {profile.topRankedCount || 0}
                </div>
                <div className="stat-desc text-[11px] text-slate-500 font-sans mt-0.5">
                  Leaderboard first-place victories
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
