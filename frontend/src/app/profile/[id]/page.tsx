'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiCamera,
  FiTrash2,
  FiPlus,
  FiX,
  FiAlertCircle,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/lib/api';
import type { UserProfile, Experience } from '@/types/profile';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';

interface PageProps {
  params: Promise<{ id: string }>;
}

function toDateInputValue(val?: string): string {
  if (!val) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
}

function formatDateDisplay(val?: string): string {
  if (!val) return '';
  if (val.toLowerCase() === 'present') return 'Present';
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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

  // Experience Modal & Date Picker State
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expFrom, setExpFrom] = useState('');
  const [expTo, setExpTo] = useState('');
  const [isExpPresent, setIsExpPresent] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [expLoading, setExpLoading] = useState(false);
  const [expError, setExpError] = useState<string | null>(null);
  const [expFeedback, setExpFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fromPickerRef = useRef<HTMLInputElement>(null);
  const toPickerRef = useRef<HTMLInputElement>(null);

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

  // Open Experience Modal
  const handleOpenAddExp = () => {
    setEditingExp(null);
    setExpTitle('');
    setExpCompany('');
    setExpFrom('');
    setExpTo('');
    setIsExpPresent(false);
    setExpDescription('');
    setExpError(null);
    setIsExpModalOpen(true);
  };

  const handleOpenEditExp = (exp: Experience) => {
    setEditingExp(exp);
    setExpTitle(exp.title);
    setExpCompany(exp.company);
    setExpFrom(toDateInputValue(exp.from));
    const isPresent = !exp.to || exp.to.toLowerCase() === 'present';
    setIsExpPresent(isPresent);
    setExpTo(isPresent ? '' : toDateInputValue(exp.to));
    setExpDescription(exp.description || '');
    setExpError(null);
    setIsExpModalOpen(true);
  };

  // Save Experience with Calendar Picker Values
  const handleSaveExp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!expTitle.trim() || !expCompany.trim() || !expFrom.trim()) {
      setExpError('Title, Company, and Start Date are required');
      return;
    }

    setExpLoading(true);
    setExpError(null);

    const payload = {
      title: expTitle.trim(),
      company: expCompany.trim(),
      from: expFrom.trim(),
      to: isExpPresent ? 'Present' : expTo.trim() || undefined,
      description: expDescription.trim() || undefined,
    };

    try {
      if (editingExp) {
        const expSubId = editingExp._id || editingExp.id;
        const endpoint =
          targetId === 'me'
            ? `/api/users/me/experiences/${expSubId}`
            : `/api/users/${profileId}/experiences/${expSubId}`;

        const res = await apiClient<UserProfile>(endpoint, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (res.data) {
          setProfile(res.data);
          setExpFeedback({
            type: 'success',
            message: `Updated experience at "${payload.company}"`,
          });
          setIsExpModalOpen(false);
          setTimeout(() => setExpFeedback(null), 3000);
        }
      } else {
        const endpoint =
          targetId === 'me'
            ? '/api/users/me/experiences'
            : `/api/users/${profileId}/experiences`;

        const res = await apiClient<UserProfile>(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.data) {
          setProfile(res.data);
          setExpFeedback({
            type: 'success',
            message: `Added experience at "${payload.company}"`,
          });
          setIsExpModalOpen(false);
          setTimeout(() => setExpFeedback(null), 3000);
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setExpError(err.message);
      } else {
        setExpError('Failed to save work experience');
      }
    } finally {
      setExpLoading(false);
    }
  };

  // Delete Experience
  const handleDeleteExp = async (expId: string, company: string) => {
    if (!profile) return;
    if (!confirm(`Are you sure you want to remove experience at ${company}?`)) {
      return;
    }

    const previousExps = [...(profile.experiences || [])];
    setProfile({
      ...profile,
      experiences: previousExps.filter(
        (e) => (e._id || e.id) !== expId,
      ),
    });

    const endpoint =
      targetId === 'me'
        ? `/api/users/me/experiences/${expId}`
        : `/api/users/${profileId}/experiences/${expId}`;

    try {
      const res = await apiClient<UserProfile>(endpoint, {
        method: 'DELETE',
      });
      if (res.data) {
        setProfile(res.data);
        setExpFeedback({
          type: 'success',
          message: `Removed experience at "${company}"`,
        });
        setTimeout(() => setExpFeedback(null), 3000);
      }
    } catch (err) {
      setProfile({ ...profile, experiences: previousExps });
      const msg =
        err instanceof ApiError ? err.message : 'Failed to delete experience';
      setExpFeedback({ type: 'error', message: msg });
      setTimeout(() => setExpFeedback(null), 3500);
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
                  className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white px-4 py-2 text-xs font-semibold font-manrope shadow-[0_4px_16px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_22px_rgba(79,70,229,0.45)] transition-all cursor-pointer"
                >
                  <FiEdit3 className="h-3.5 w-3.5" />
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

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar Ring with Live Photo Controls */}
              <div className="flex flex-col items-center sm:items-start gap-2 shrink-0">
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

                {/* Owner/Admin Action buttons under avatar */}
                {canEdit && (
                  <div className="flex items-center space-x-1.5 pt-1">
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
                      className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                    >
                      <FiCamera className="h-3 w-3" />
                      <span>{avatarUploading ? 'Saving...' : 'Upload Photo'}</span>
                    </button>

                    {profile.avatarUrl && (
                      <button
                        type="button"
                        disabled={avatarUploading}
                        onClick={handleRemoveAvatar}
                        title="Remove custom photo and use initials"
                        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        <FiTrash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                )}
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

          {/* Feedback Toasts for Experience */}
          <AnimatePresence>
            {expFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center space-x-2.5 text-xs font-medium rounded-2xl p-3.5 border shadow-sm ${
                  expFeedback.type === 'success'
                    ? 'text-emerald-700 bg-emerald-50/90 border-emerald-200'
                    : 'text-rose-700 bg-rose-50/90 border-rose-200'
                }`}
              >
                {expFeedback.type === 'success' ? (
                  <FiCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{expFeedback.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Two-Column Grid: Skills & Work Experiences */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Skills Column (1 col) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <FiAward className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-bold font-manrope text-slate-900 tracking-tight">
                    Skills
                  </h2>
                </div>

                {canEdit && (
                  <Link
                    href={`/profile/${profileId}/edit`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 font-manrope"
                  >
                    Edit
                  </Link>
                )}
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
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                    <FiBriefcase className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-bold font-manrope text-slate-900 tracking-tight">
                    Work Experience
                  </h2>
                </div>

                {canEdit && (
                  <button
                    type="button"
                    onClick={handleOpenAddExp}
                    id="profile-add-exp-btn"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold font-manrope text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200/80 hover:border-emerald-600 px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    <FiPlus className="h-3.5 w-3.5" />
                    <span>Add Experience</span>
                  </button>
                )}
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

                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center space-x-1 rounded-lg bg-slate-100/80 px-2.5 py-1 text-[11px] font-mono font-medium text-slate-600">
                              <FiCalendar className="h-3 w-3 text-slate-400" />
                              <span>
                                {formatDateDisplay(exp.from)} – {formatDateDisplay(exp.to)}
                              </span>
                            </span>

                            {canEdit && (
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditExp(exp)}
                                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                  title="Edit Experience"
                                >
                                  <FiEdit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteExp(
                                      exp._id || exp.id || '',
                                      exp.company,
                                    )
                                  }
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Experience"
                                >
                                  <FiTrash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
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

          {/* DaisyUI-Themed Community Impact Stats Component (Under Skills & Experience) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="stats shadow-sm w-full rounded-3xl border border-white/80 bg-white/65 p-2 sm:p-3 backdrop-blur-3xl backdrop-saturate-200 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100/90"
          >
            {/* Stat 1: Reactions */}
            <div className="stat flex items-center space-x-4 p-4 sm:p-6">
              <div className="stat-figure text-rose-500 bg-rose-50 p-3.5 rounded-2xl border border-rose-100/80 shadow-2xs shrink-0">
                <FiHeart className="h-6 w-6 stroke-current" />
              </div>
              <div>
                <div className="stat-title text-xs font-bold uppercase tracking-wider text-slate-400 font-manrope">
                  Reactions Received
                </div>
                <div className="stat-value text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900 mt-0.5">
                  {profile.reactionsCount || 0}
                </div>
                <div className="stat-desc text-[11px] text-slate-500 font-sans mt-0.5">
                  Across all community posts
                </div>
              </div>
            </div>

            {/* Stat 2: Posts Made */}
            <div className="stat flex items-center space-x-4 p-4 sm:p-6">
              <div className="stat-figure text-indigo-600 bg-indigo-50 p-3.5 rounded-2xl border border-indigo-100/80 shadow-2xs shrink-0">
                <FiFileText className="h-6 w-6 stroke-current" />
              </div>
              <div>
                <div className="stat-title text-xs font-bold uppercase tracking-wider text-slate-400 font-manrope">
                  Posts Published
                </div>
                <div className="stat-value text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900 mt-0.5">
                  {profile.postsCount || 0}
                </div>
                <div className="stat-desc text-[11px] text-slate-500 font-sans mt-0.5">
                  Technical articles & discussions
                </div>
              </div>
            </div>

            {/* Stat 3: #1 Ranked Posts */}
            <div className="stat flex items-center space-x-4 p-4 sm:p-6">
              <div className="stat-figure text-amber-500 bg-amber-50 p-3.5 rounded-2xl border border-amber-100/80 shadow-2xs shrink-0">
                <FiTrendingUp className="h-6 w-6 stroke-current" />
              </div>
              <div>
                <div className="stat-title text-xs font-bold uppercase tracking-wider text-slate-400 font-manrope">
                  Ranked #1 Honors
                </div>
                <div className="stat-value text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900 mt-0.5">
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

      {/* Experience Form Modal with Interactive Calendar Date Pickers */}
      <AnimatePresence>
        {isExpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/80 bg-white p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-5 text-left z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                    <FiBriefcase className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold font-manrope text-slate-900">
                    {editingExp ? 'Edit Work Experience' : 'Add Work Experience'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              {expError && (
                <div className="flex items-center space-x-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl p-3">
                  <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{expError}</span>
                </div>
              )}

              <form onSubmit={handleSaveExp} className="space-y-4">
                <div>
                  <label
                    htmlFor="exp-title-input"
                    className="block text-xs font-semibold text-slate-700 mb-1 font-manrope"
                  >
                    Job Title *
                  </label>
                  <input
                    id="exp-title-input"
                    type="text"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    required
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                  />
                </div>

                <div>
                  <label
                    htmlFor="exp-company-input"
                    className="block text-xs font-semibold text-slate-700 mb-1 font-manrope"
                  >
                    Company / Organization *
                  </label>
                  <input
                    id="exp-company-input"
                    type="text"
                    value={expCompany}
                    onChange={(e) => setExpCompany(e.target.value)}
                    required
                    placeholder="e.g. Google, Acme Inc."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                  />
                </div>

                {/* Date Selection with Calendar Date Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div>
                    <label
                      htmlFor="exp-modal-from"
                      className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
                    >
                      Start Date (Calendar) *
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="exp-modal-from"
                        ref={fromPickerRef}
                        type="date"
                        value={expFrom}
                        onChange={(e) => setExpFrom(e.target.value)}
                        onClick={() => fromPickerRef.current?.showPicker?.()}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans cursor-pointer"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => fromPickerRef.current?.showPicker?.()}
                        className="absolute right-3 p-1 text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors"
                        title="Open calendar picker"
                      >
                        <FiCalendar className="h-4 w-4" />
                      </button>
                    </div>
                    {expFrom ? (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        Selected: {formatDateDisplay(expFrom)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Click to select date
                      </p>
                    )}
                  </div>

                  {/* End Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="exp-modal-to"
                        className="block text-xs font-semibold text-slate-700 font-manrope"
                      >
                        End Date (Calendar)
                      </label>
                      <label className="inline-flex items-center space-x-1.5 text-xs text-slate-600 font-sans cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isExpPresent}
                          onChange={(e) => {
                            setIsExpPresent(e.target.checked);
                            if (e.target.checked) setExpTo('');
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                        />
                        <span className="text-[11px] font-medium text-emerald-700">Present</span>
                      </label>
                    </div>

                    {!isExpPresent ? (
                      <div>
                        <div className="relative flex items-center">
                          <input
                            id="exp-modal-to"
                            ref={toPickerRef}
                            type="date"
                            value={expTo}
                            onChange={(e) => setExpTo(e.target.value)}
                            onClick={() => toPickerRef.current?.showPicker?.()}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans cursor-pointer"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => toPickerRef.current?.showPicker?.()}
                            className="absolute right-3 p-1 text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors"
                            title="Open calendar picker"
                          >
                            <FiCalendar className="h-4 w-4" />
                          </button>
                        </div>
                        {expTo ? (
                          <p className="text-[11px] text-emerald-600 font-medium mt-1">
                            Selected: {formatDateDisplay(expTo)}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-1">
                            Click to select date
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 font-sans flex items-center space-x-1.5 h-[42px]">
                        <FiCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Currently working here (Present)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="exp-desc-input"
                    className="block text-xs font-semibold text-slate-700 mb-1 font-manrope"
                  >
                    Description & Key Contributions
                  </label>
                  <textarea
                    id="exp-desc-input"
                    rows={3}
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    placeholder="Describe your responsibilities, architectures designed, and impact..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsExpModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold font-manrope text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-exp-btn"
                    type="submit"
                    disabled={expLoading}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 text-xs font-semibold font-manrope shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <FiCheck className="h-4 w-4" />
                    <span>{expLoading ? 'Saving...' : 'Save Experience'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
