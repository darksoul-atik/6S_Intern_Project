/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";

import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";

import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiAward,
  FiBriefcase,
  FiCalendar,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiFolder,
  FiGlobe,
  FiMessageSquare,
  FiShare2,
  FiShield,
  FiTrash2,
} from "react-icons/fi";
import { LuTrophy } from "react-icons/lu";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/types/api";
import { compressImage } from "../utils/image-utils";

import { formatExpDate, getInitials } from "@/lib/utils/formatters";

import { useDeleteAvatarMutation, useUpdateAvatarMutation } from "../mutations/user-mutations";
import { useUserProfile } from "../queries/user-queries";

import { ProfileSkeleton } from "./profile-skeleton";

interface ProfileViewProps {
  targetId?: string;
}

/*
|--------------------------------------------------------------------------
| Portfolio Month Formatter
|--------------------------------------------------------------------------
|
| Backend stores:
|
| 2026-01
| 2026-08
|
| UI displays:
|
| Jan 2026
| Aug 2026
|--------------------------------------------------------------------------
*/

function formatProjectMonth(value?: string | null) {
  if (!value) {
    return "";
  }

  const [year, month] = value.split("-");

  if (!year || !month) {
    return value;
  }

  const date = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function cleanProjectUrl(raw: string): string {
  if (!raw) return "";
  try {
    const url = raw.startsWith("http") ? raw : `https://${raw}`;
    const parsed = new URL(url);
    const path = parsed.pathname !== "/" ? parsed.pathname : "";
    return parsed.hostname.replace(/^www\./, "") + path;
  } catch {
    return raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/$/, "");
  }
}

export function ProfileView({ targetId = "me" }: ProfileViewProps) {
  const isOwn = !targetId || targetId === "me";

  const { user: currentUser, isLoading: authLoading } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | Profile Query
  |--------------------------------------------------------------------------
  */

  const {
    data: profile,
    isLoading: loading,
    error: queryError,
  } = useUserProfile(targetId);

  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Failed to load profile"
    : null;

  /*
  |--------------------------------------------------------------------------
  | Share
  |--------------------------------------------------------------------------
  */

  const [copied, setCopied] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Avatar Mutations
  |--------------------------------------------------------------------------
  */

  const updateAvatarMutation = useUpdateAvatarMutation(targetId);

  const deleteAvatarMutation = useDeleteAvatarMutation(targetId);

  const avatarUploading =
    updateAvatarMutation.isPending || deleteAvatarMutation.isPending;

  const [avatarToast, setAvatarToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /*
  |--------------------------------------------------------------------------
  | Identity / Permissions
  |--------------------------------------------------------------------------
  |
  | The profile API should not be relied on
  | for role/email/admin information anymore.
  |
  | Auth data comes from AuthContext.
  |--------------------------------------------------------------------------
  */

  const profileId =
    profile?.id || profile?._id || (isOwn ? currentUser?.id : targetId);

  const isOwner =
    isOwn ||
    Boolean(currentUser?.id && profileId && currentUser.id === profileId);

  const isAdmin = currentUser?.role === "admin";

  /*
   * Keep previous authorization behavior.
   *
   * We determine admin status from AuthContext,
   * NOT from public profile data.
   */
  const canEdit = Boolean(isOwner || isAdmin);

  /*
  |--------------------------------------------------------------------------
  | Share Handler
  |--------------------------------------------------------------------------
  */

  const handleShare = () => {
    if (typeof window === "undefined" || !profileId) {
      return;
    }

    const shareUrl = `${window.location.origin}/developers/${profileId}`;

    navigator.clipboard.writeText(shareUrl);

    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  /*
  |--------------------------------------------------------------------------
  | Avatar Upload
  |--------------------------------------------------------------------------
  */

  const handleAvatarFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarToast({
        type: "error",
        message: "Please select a valid image file (PNG, JPG, WebP)",
      });

      setTimeout(() => setAvatarToast(null), 3000);

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarToast({
        type: "error",
        message: "Image size should be less than 5MB",
      });

      setTimeout(() => setAvatarToast(null), 3000);

      return;
    }

    setAvatarToast(null);

    try {
      const dataUrl = await compressImage(file, 400, 0.88);

      await updateAvatarMutation.mutateAsync(dataUrl);

      setAvatarToast({
        type: "success",
        message: "Profile picture updated successfully!",
      });

      setTimeout(() => setAvatarToast(null), 3000);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to update avatar";

      setAvatarToast({
        type: "error",
        message,
      });

      setTimeout(() => setAvatarToast(null), 3500);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Remove Avatar
  |--------------------------------------------------------------------------
  */

  const handleRemoveAvatar = async () => {
    if (!profile) {
      return;
    }

    try {
      await deleteAvatarMutation.mutateAsync();

      setAvatarToast({
        type: "success",
        message: "Profile picture removed. Initials restored.",
      });

      setTimeout(() => setAvatarToast(null), 3000);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to remove avatar";

      setAvatarToast({
        type: "error",
        message,
      });

      setTimeout(() => setAvatarToast(null), 3500);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading || authLoading) {
    return <ProfileSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error || !profile) {
    const is401 =
      error?.includes("401") ||
      error?.toLowerCase().includes("unauthorized") ||
      error?.toLowerCase().includes("active session");

    const is404 =
      error?.includes("404") || error?.toLowerCase().includes("not found");

    const is403 =
      error?.includes("403") ||
      error?.toLowerCase().includes("permission") ||
      error?.toLowerCase().includes("forbidden");

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center backdrop-blur-2xl shadow-xl space-y-4">
          <div
            className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold font-mono shadow-sm ${
              is401
                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                : is403
                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : "bg-rose-100 text-rose-700 border border-rose-200"
            }`}
          >
            {is401 ? "401" : is403 ? "403" : is404 ? "404" : "!"}
          </div>

          <h2 className="text-xl font-bold font-manrope text-slate-900">
            {is401
              ? "Authentication Required"
              : is403
                ? "Access Forbidden"
                : is404
                  ? "Developer Not Found"
                  : "Profile Unavailable"}
          </h2>

          <p className="text-sm text-slate-600 font-sans leading-relaxed">
            {is401
              ? "Please sign in to your DevPulse account to view this profile."
              : is403
                ? "You do not have authorization to access this profile data."
                : is404
                  ? "The requested developer profile does not exist or has been removed."
                  : error || "Unable to load profile at this time."}
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

  const skillsCount = profile.skills?.length ?? 0;

  const experienceCount = profile.experiences?.length ?? 0;

  const projectsCount = profile.portfolioProjects?.length ?? 0;

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Dot Texture */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-size-[24px_24px] opacity-60 pointer-events-none"
        aria-hidden="true"
      />

      {/* Radiant Glow Orbs */}
      <div
        className="absolute top-12 left-1/4 -translate-x-1/2 w-137.5 h-125 rounded-full bg-linear-to-tr from-indigo-300/30 via-emerald-200/20 to-transparent blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="absolute top-28 right-1/4 translate-x-1/3 w-150 h-130 rounded-full bg-linear-to-bl from-emerald-300/25 via-indigo-200/20 to-transparent blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          {/* Top Navigation */}
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
                className="inline-flex items-center space-x-1.5 text-xs font-semibold font-manrope text-slate-600 hover:text-indigo-600 bg-white/70 hover:bg-white border border-slate-200/70 rounded-xl px-3 sm:px-3.5 py-2 backdrop-blur-md shadow-xs transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <FiCheck className="h-3.5 w-3.5 text-emerald-600" />

                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <FiShare2 className="h-3.5 w-3.5" />

                    <span className="hidden min-[380px]:inline">
                      Share Profile
                    </span>

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

          {/* Avatar Feedback */}
          <AnimatePresence>
            {avatarToast && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                }}
                className={`p-3.5 rounded-2xl text-xs font-medium font-sans flex items-center justify-between border backdrop-blur-md ${
                  avatarToast.type === "success"
                    ? "bg-emerald-50/90 border-emerald-200 text-emerald-800"
                    : "bg-rose-50/90 border-rose-200 text-rose-800"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {avatarToast.type === "success" ? (
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

          {/* Hero Identity Card */}
          <div className="rounded-3xl border border-white/80 bg-white/75 p-6 sm:p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl relative overflow-hidden">
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Identity */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 w-full md:flex-1">
                {/* Avatar */}
                <div className="relative group shrink-0">
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden shadow-md ring-4 ring-white/90 transition-transform group-hover:scale-[1.02]">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-linear-to-br from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold font-manrope text-2xl sm:text-3xl shadow-inner">
                        {initials}
                      </div>
                    )}

                    {avatarUploading && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
                        <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Avatar Actions */}
                  {canEdit && (
                    <div className="absolute -bottom-2 -right-2 flex items-center gap-1.5 z-20">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        title={
                          avatarUploading
                            ? "Uploading..."
                            : "Change profile picture"
                        }
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
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </div>

                {/* User Details */}
                <div className="space-y-2.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-bold font-manrope tracking-tight text-slate-900">
                      {profile.name}
                    </h1>

                    {isOwner && isAdmin && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-manrope bg-indigo-500/10 text-indigo-700 border border-indigo-500/25 backdrop-blur-md shadow-[0_2px_8px_rgba(99,102,241,0.1)]">
                        <FiShield className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Admin</span>
                      </span>
                    )}

                    {memberSince && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-sans text-slate-500 bg-white/70 border border-white/90 backdrop-blur-md shadow-2xs">
                        <FiCalendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Member since {memberSince}</span>
                      </div>
                    )}
                  </div>

                  {/* New Contract: headline */}
                  <p className="text-sm font-medium font-sans text-indigo-600">
                    {profile.headline || "Developer"}
                  </p>

                  {/* New Contract: bio */}
                  {profile.bio ? (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl pt-1 whitespace-pre-line">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic pt-1">
                      No bio added yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Derived Public Stats - Matching Glass Icons */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                {/* Skills */}
                <div className="group flex flex-col items-center justify-center min-w-23 sm:min-w-27 px-3.5 py-3 rounded-2xl bg-white/70 hover:bg-white/90 border border-white/90 hover:border-indigo-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 flex items-center justify-center backdrop-blur-md shadow-2xs transition-transform group-hover:scale-110">
                    <FiAward className="h-5 w-5 text-indigo-600" />
                  </div>

                  <div className="text-lg sm:text-xl font-extrabold font-manrope text-slate-900 mt-2 tracking-tight">
                    {skillsCount}
                  </div>

                  <div className="text-[10px] sm:text-[11px] font-bold font-manrope text-slate-500 uppercase tracking-wider mt-0.5">
                    Skills
                  </div>
                </div>

                {/* Experience */}
                <div className="group flex flex-col items-center justify-center min-w-23 sm:min-w-27 px-3.5 py-3 rounded-2xl bg-white/70 hover:bg-white/90 border border-white/90 hover:border-emerald-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 flex items-center justify-center backdrop-blur-md shadow-2xs transition-transform group-hover:scale-110">
                    <FiBriefcase className="h-5 w-5 text-emerald-600" />
                  </div>

                  <div className="text-lg sm:text-xl font-extrabold font-manrope text-slate-900 mt-2 tracking-tight">
                    {experienceCount}
                  </div>

                  <div className="text-[10px] sm:text-[11px] font-bold font-manrope text-slate-500 uppercase tracking-wider mt-0.5">
                    Experience
                  </div>
                </div>

                {/* Projects */}
                <div className="group flex flex-col items-center justify-center min-w-23 sm:min-w-27 px-3.5 py-3 rounded-2xl bg-white/70 hover:bg-white/90 border border-white/90 hover:border-indigo-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 flex items-center justify-center backdrop-blur-md shadow-2xs transition-transform group-hover:scale-110">
                    <FiFolder className="h-5 w-5 text-indigo-600" />
                  </div>

                  <div className="text-lg sm:text-xl font-extrabold font-manrope text-slate-900 mt-2 tracking-tight">
                    {projectsCount}
                  </div>

                  <div className="text-[10px] sm:text-[11px] font-bold font-manrope text-slate-500 uppercase tracking-wider mt-0.5">
                    Projects
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills + Experience */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Skills */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-3xl border border-white/80 bg-white/75 p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <FiAward className="h-4 w-4" />
                    </div>

                    <h3 className="text-sm font-bold font-manrope text-slate-900">
                      Technical Skills
                    </h3>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-manrope bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 backdrop-blur-md shadow-2xs">
                    <FiAward className="h-3.5 w-3.5 text-indigo-600" />
                    <span>
                      {profile.skills?.length || 0}{" "}
                      {profile.skills?.length === 1 ? "Skill" : "Skills"}
                    </span>
                  </span>
                </div>

                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold font-manrope bg-white/70 hover:bg-white/95 text-slate-700 hover:text-indigo-600 border border-white/90 hover:border-indigo-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all duration-150 hover:scale-105"
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

            {/* Experience */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-white/80 bg-white/75 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <FiBriefcase className="h-4 w-4" />
                    </div>

                    <h3 className="text-sm font-bold font-manrope text-slate-900">
                      Work Experience
                    </h3>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-manrope bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 backdrop-blur-md shadow-2xs">
                    <FiBriefcase className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      {profile.experiences?.length || 0}{" "}
                      {profile.experiences?.length === 1
                        ? "Position"
                        : "Positions"}
                    </span>
                  </span>
                </div>

                {profile.experiences && profile.experiences.length > 0 ? (
                  <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {profile.experiences.map((experience, index) => (
                      <div
                        key={experience._id || experience.id || index}
                        className="relative group"
                      >
                        {/* Timeline Dot */}
                        <div className="absolute -left-6 top-1.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-transform group-hover:scale-125" />

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <h4 className="text-sm font-bold font-manrope text-slate-900">
                              {experience.title}
                            </h4>

                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold font-manrope text-slate-600 bg-white/85 border border-slate-200/70 backdrop-blur-md shadow-2xs">
                              <FiCalendar className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span>
                                {formatExpDate(experience.from)} —{" "}
                                {formatExpDate(experience.to)}
                              </span>
                            </span>
                          </div>

                          <div className="text-xs font-semibold font-sans text-emerald-600">
                            {experience.company}
                          </div>

                          {experience.description && (
                            <p className="text-xs font-sans text-slate-600 leading-relaxed pt-1">
                              {experience.description}
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
                        className="inline-block text-emerald-600 hover:underline font-semibold"
                      >
                        + Add Work Experience in Edit
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio Projects */}
          <div className="rounded-3xl border border-white/80 bg-white/75 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl space-y-6">
            {/* Portfolio Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <FiFolder className="h-4 w-4" />
                </div>

                <h3 className="text-sm font-bold font-manrope text-slate-900">
                  Portfolio Projects
                </h3>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-manrope bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 backdrop-blur-md shadow-2xs">
                <FiFolder className="h-3.5 w-3.5 text-indigo-600" />
                <span>
                  {projectsCount} {projectsCount === 1 ? "Project" : "Projects"}
                </span>
              </span>
            </div>

            {profile.portfolioProjects &&
            profile.portfolioProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.portfolioProjects.map((project, index) => {
                  const projectId = project.id || project._id || index;

                  const start = formatProjectMonth(project.startDate);

                  const end = project.isCurrent
                    ? "Present"
                    : formatProjectMonth(project.endDate);

                  return (
                    <div
                      key={projectId}
                      className="group rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all space-y-4"
                    >
                      {/* Title / Date */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold font-manrope text-slate-900">
                            {project.title}
                          </h4>

                          {start && (
                            <p className="text-[11px] text-slate-400 mt-1 font-medium">
                              {start}
                              {" — "}
                              {end || "Present"}
                            </p>
                          )}
                        </div>

                        {project.isCurrent && (
                          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold font-manrope text-emerald-700 bg-white/80 border border-white/90 backdrop-blur-md shadow-2xs">
                            <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>Currently working on</span>
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {project.description}
                      </p>

                      {/* Technologies */}
                      {project.technologies &&
                        project.technologies.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {project.technologies
                              .flatMap((tech) =>
                                typeof tech === "string"
                                  ? tech.split(/,\s*/)
                                  : [],
                              )
                              .filter(Boolean)
                              .map((technology, technologyIndex) => (
                                <span
                                  key={`${technology}-${technologyIndex}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold font-manrope bg-white/90 text-slate-700 border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-600 shadow-2xs backdrop-blur-md transition-all duration-150"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/80 shrink-0" />
                                  <span>{technology}</span>
                                </span>
                              ))}
                          </div>
                        )}

                      {/* URLs */}
                      {project.urls && project.urls.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                          {project.urls.map((url, urlIndex) => {
                            const fullHref = url.startsWith("http")
                              ? url
                              : `https://${url}`;
                            const displayLabel = cleanProjectUrl(url);

                            return (
                              <a
                                key={`${url}-${urlIndex}`}
                                href={fullHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/link inline-flex items-center gap-2 max-w-full px-3.5 py-1.5 rounded-xl text-xs font-semibold font-manrope text-slate-700 hover:text-indigo-600 bg-white/90 hover:bg-white border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-xs backdrop-blur-md transition-all"
                              >
                                <div className="h-5 w-5 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 group-hover/link:bg-indigo-600 group-hover/link:text-white transition-colors">
                                  <FiGlobe className="h-3 w-3" />
                                </div>

                                <span className="truncate font-medium text-slate-700 group-hover/link:text-indigo-600 transition-colors">
                                  {displayLabel}
                                </span>

                                <FiExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover/link:text-indigo-600 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all ml-0.5" />
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400 font-sans space-y-2 border-2 border-dashed border-slate-200/80 rounded-2xl">
                <p>No portfolio projects added yet.</p>

                {canEdit && (
                  <Link
                    href="/profile/edit"
                    className="inline-block text-indigo-600 hover:underline font-semibold"
                  >
                    + Add Portfolio Project in Edit
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Community & Engagement Stats */}
          <div className="rounded-3xl border border-white/80 bg-white/75 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <FiActivity className="h-4 w-4" />
                </div>

                <h3 className="text-sm font-bold font-manrope text-slate-900">
                  Community & Engagement Stats
                </h3>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold font-manrope text-slate-700 bg-white/85 border border-white/90 backdrop-blur-md shadow-2xs">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <FiActivity className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Developer Activity</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Published Posts */}
              <div className="group rounded-2xl border border-white/90 bg-white/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 backdrop-blur-xl transition-all duration-200 flex items-center gap-4 hover:-translate-y-0.5">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 flex items-center justify-center shrink-0 backdrop-blur-md shadow-[0_2px_10px_rgba(99,102,241,0.12)] transition-transform group-hover:scale-110">
                  <FiFileText className="h-6 w-6 text-indigo-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900 tracking-tight">
                    {profile.postsCount ?? 0}
                  </div>

                  <div className="text-xs font-bold font-manrope text-slate-700 mt-1">
                    Total Posts
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="group rounded-2xl border border-white/90 bg-white/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 backdrop-blur-xl transition-all duration-200 flex items-center gap-4 hover:-translate-y-0.5">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 flex items-center justify-center shrink-0 backdrop-blur-md shadow-[0_2px_10px_rgba(16,185,129,0.12)] transition-transform group-hover:scale-110">
                  <FiMessageSquare className="h-6 w-6 text-emerald-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900 tracking-tight">
                    {profile.commentsCount ?? profile.reactionsCount ?? 0}
                  </div>

                  <div className="text-xs font-bold font-manrope text-slate-700 mt-1">
                    Total Comments
                  </div>
                </div>
              </div>

              {/* Times Being #1 */}
              <div className="group rounded-2xl border border-amber-200/90 bg-linear-to-br from-amber-50/40 via-white to-orange-50/20 p-5 shadow-[0_4px_20px_rgba(245,158,11,0.04)] hover:shadow-md hover:border-amber-300 backdrop-blur-xl transition-all duration-200 flex items-center gap-4 hover:-translate-y-0.5">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-600 flex items-center justify-center shrink-0 backdrop-blur-md shadow-[0_2px_10px_rgba(245,158,11,0.15)] transition-transform group-hover:scale-110">
                  <LuTrophy className="h-6 w-6 text-amber-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900 tracking-tight flex items-baseline gap-1.5">
                    {profile.topRankedCount ?? 0}
                    <span className="text-xs font-semibold text-amber-600 font-manrope">
                      Times
                    </span>
                  </div>

                  <div className="text-xs font-bold font-manrope text-slate-700 mt-1">
                    #1 Top Ranked
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
