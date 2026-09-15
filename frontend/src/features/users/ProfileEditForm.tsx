'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiAward,
  FiBriefcase,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiAlertCircle,
  FiArrowLeft,
  FiCamera,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import {
  useUserProfile,
  useUpdateProfileMutation,
  useAddSkillMutation,
  useRemoveSkillMutation,
  useAddExperienceMutation,
  useUpdateExperienceMutation,
  useDeleteExperienceMutation,
  type Experience,
  type ExperiencePayload,
} from './users.api';
import { ProfileSkeleton } from './ProfileSkeleton';
import { ExperienceModal } from './ExperienceModal';
import { compressImage } from '@/lib/image';
import { getInitials, formatExpDate } from '@/lib/formatters';

export function ProfileEditForm() {
  const { user: currentUser, isLoading: authLoading } = useAuth();

  // TanStack Query Profile Data
  const {
    data: profile,
    isLoading: loading,
    error: queryError,
  } = useUserProfile('me');

  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : 'Failed to load profile for editing'
    : null;

  // TanStack Query Mutations
  const updateProfileMutation = useUpdateProfileMutation('me');
  const addSkillMutation = useAddSkillMutation();
  const removeSkillMutation = useRemoveSkillMutation();
  const addExperienceMutation = useAddExperienceMutation();
  const updateExperienceMutation = useUpdateExperienceMutation();
  const deleteExperienceMutation = useDeleteExperienceMutation();

  // Basic Profile Edit State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasInitializedForm, setHasInitializedForm] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial profile values once loaded
  useEffect(() => {
    if (profile && !hasInitializedForm) {
      setName(profile.name || '');
      setTitle(profile.title || '');
      setAvatarUrl(profile.avatarUrl || null);
      setHasInitializedForm(true);
    }
  }, [profile, hasInitializedForm]);

  // Skills Edit State
  const [newSkillInput, setNewSkillInput] = useState('');
  const [skillFeedback, setSkillFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const skillLoading =
    addSkillMutation.isPending || removeSkillMutation.isPending;

  // Experience Edit State (delegated to ExperienceModal)
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [expFeedback, setExpFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const expLoading =
    addExperienceMutation.isPending ||
    updateExperienceMutation.isPending ||
    deleteExperienceMutation.isPending;

  // Handle Avatar selection with shared compressImage utility
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNameError('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNameError('Image size should be less than 5MB');
      return;
    }

    setAvatarUploading(true);
    setNameError(null);

    try {
      const dataUrl = await compressImage(file, 400, 0.88);
      setAvatarUrl(dataUrl);
    } catch {
      setNameError('Failed to process image');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  // Save basic profile (name, title, avatarUrl)
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!name.trim()) {
      setNameError('Name cannot be empty');
      return;
    }

    setSavingName(true);
    setNameError(null);
    setNameSuccess(false);

    const payload = {
      name: name.trim(),
      title: title.trim() || undefined,
      avatarUrl: avatarUrl ? avatarUrl : '',
    };

    try {
      const updated = await updateProfileMutation.mutateAsync(payload);
      setName(updated.name || '');
      setTitle(updated.title || '');
      setAvatarUrl(updated.avatarUrl || null);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setNameError(err.message);
      } else {
        setNameError('Failed to update profile details');
      }
    } finally {
      setSavingName(false);
    }
  };

  // Add Skill
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const trimmedSkill = newSkillInput.trim();
    if (!trimmedSkill) return;

    if (
      profile.skills?.some(
        (s) => s.toLowerCase() === trimmedSkill.toLowerCase(),
      )
    ) {
      setSkillFeedback({
        type: 'error',
        message: `Skill "${trimmedSkill}" is already in your skills list.`,
      });
      setTimeout(() => setSkillFeedback(null), 3000);
      return;
    }

    setSkillFeedback(null);
    setNewSkillInput('');

    try {
      await addSkillMutation.mutateAsync(trimmedSkill);
      setSkillFeedback({
        type: 'success',
        message: `Added skill "${trimmedSkill}"`,
      });
      setTimeout(() => setSkillFeedback(null), 3000);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to add skill';
      setSkillFeedback({ type: 'error', message: msg });
      setTimeout(() => setSkillFeedback(null), 3500);
    }
  };

  // Remove Skill
  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!profile) return;

    try {
      await removeSkillMutation.mutateAsync(skillToRemove);
      setSkillFeedback({
        type: 'success',
        message: `Removed skill "${skillToRemove}"`,
      });
      setTimeout(() => setSkillFeedback(null), 3000);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to remove skill';
      setSkillFeedback({ type: 'error', message: msg });
      setTimeout(() => setSkillFeedback(null), 3500);
    }
  };

  // Open Add Experience Modal
  const handleOpenAddExp = () => {
    setEditingExp(null);
    setIsExpModalOpen(true);
  };

  // Open Edit Experience Modal
  const handleOpenEditExp = (exp: Experience) => {
    setEditingExp(exp);
    setIsExpModalOpen(true);
  };

  // Save Experience Modal Submit
  const handleSaveExpModal = async (payload: ExperiencePayload) => {
    if (editingExp) {
      const expSubId = editingExp._id || editingExp.id!;
      await updateExperienceMutation.mutateAsync({
        id: expSubId,
        data: payload,
      });
      setExpFeedback({
        type: 'success',
        message: `Updated experience at "${payload.company}"`,
      });
      setTimeout(() => setExpFeedback(null), 3000);
    } else {
      await addExperienceMutation.mutateAsync(payload);
      setExpFeedback({
        type: 'success',
        message: `Added experience at "${payload.company}"`,
      });
      setTimeout(() => setExpFeedback(null), 3000);
    }
  };

  // Delete Experience
  const handleDeleteExp = async (expId: string, company: string) => {
    if (!profile) return;
    if (!confirm(`Are you sure you want to remove experience at ${company}?`)) {
      return;
    }

    try {
      await deleteExperienceMutation.mutateAsync(expId);
      setExpFeedback({
        type: 'success',
        message: `Removed experience at "${company}"`,
      });
      setTimeout(() => setExpFeedback(null), 3000);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to delete experience';
      setExpFeedback({ type: 'error', message: msg });
      setTimeout(() => setExpFeedback(null), 3500);
    }
  };

  if (loading || authLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center backdrop-blur-2xl shadow-xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto text-xl font-bold font-mono">
            !
          </div>
          <h2 className="text-xl font-bold font-manrope text-slate-900">
            Failed to Load Profile
          </h2>
          <p className="text-xs text-slate-600 font-sans">
            {error || 'Unable to load profile data for editing.'}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] text-white px-5 py-2.5 text-xs font-semibold font-manrope transition-all shadow-md"
          >
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
          {/* Header Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center space-x-1.5 sm:space-x-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/70 rounded-xl px-3 sm:px-3.5 py-2 backdrop-blur-md shadow-xs transition-all"
            >
              <FiArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Profile</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1.5 sm:space-x-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/70 rounded-xl px-3 sm:px-3.5 py-2 backdrop-blur-md shadow-xs transition-all"
            >
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Title Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70"
          >
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-manrope text-slate-900">
                Edit Developer Profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-sans">
                Update your avatar picture, display name, professional headline, skills, and experience.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {profile.role === 'admin' ? (
                <span
                  id="profile-role-badge"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-manrope bg-purple-50/90 text-purple-700 border border-purple-200/90 shadow-2xs"
                >
                  <FiShield className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span>Administrator</span>
                </span>
              ) : (
                <span
                  id="profile-role-badge"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-manrope bg-slate-100/90 text-slate-700 border border-slate-200/90 shadow-2xs hover:bg-slate-100 transition-colors"
                >
                  <FiCheckCircle className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>Verified User</span>
                </span>
              )}
            </div>
          </motion.div>

          {/* Section 1: Profile Details & Avatar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-white/80 bg-white/60 p-4 sm:p-7 md:p-8 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] space-y-6"
          >
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <FiUser className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold font-manrope text-slate-900">
                  Profile Details & Avatar
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Manage your avatar picture, display name, and professional title.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveName} className="space-y-6 pt-1">
              {/* Avatar Upload Block */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="relative group">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 p-[2px] shadow-sm overflow-hidden">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar preview"
                          className="h-full w-full object-cover rounded-[14px]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-900 text-white font-manrope font-bold text-xl tracking-tight">
                          {getInitials(name || profile.name)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Icon buttons matching exact image width */}
                  <div className="flex items-center justify-between gap-1.5 w-20">
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
                      title={avatarUploading ? 'Processing...' : 'Upload Photo'}
                      aria-label="Upload Photo"
                      className="flex-1 inline-flex items-center justify-center h-8 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] shadow-md hover:shadow-lg hover:border-indigo-500/40 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {avatarUploading ? (
                        <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                      ) : (
                        <FiCamera className="h-3.5 w-3.5 text-indigo-400" />
                      )}
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        title="Remove Photo"
                        aria-label="Remove Photo"
                        className="flex-1 inline-flex items-center justify-center h-8 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] shadow-md hover:border-red-500/40 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <FiTrash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-300" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 flex-1">
                  <h3 className="text-xs font-bold font-manrope text-slate-900">
                    Profile Picture / Avatar
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Upload an avatar image (PNG, JPG, WebP max 5MB). Use the buttons below the photo to upload or remove. If removed, initials are used automatically.
                  </p>
                </div>
              </div>

              {/* Name & Title Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="profile-name-input"
                    className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
                  >
                    Full Display Name *
                  </label>
                  <input
                    id="profile-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-title-input"
                    className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
                  >
                    Professional Title / Headline
                  </label>
                  <input
                    id="profile-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Feedback messages for Basic Details */}
              <AnimatePresence>
                {nameError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center space-x-2"
                  >
                    <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{nameError}</span>
                  </motion.div>
                )}

                {nameSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 flex items-center space-x-2"
                  >
                    <FiCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Profile details updated successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-2">
                <button
                  id="save-profile-btn"
                  type="submit"
                  disabled={savingName}
                  className="inline-flex items-center space-x-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] disabled:opacity-50 text-white px-5 py-2.5 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-indigo-500/40 transition-all cursor-pointer"
                >
                  <FiCheck className="h-4 w-4 text-indigo-400" />
                  <span>{savingName ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          </motion.div>

          {/* Section 2: Technical Skills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-white/80 bg-white/60 p-4 sm:p-7 md:p-8 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] space-y-6"
          >
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                <FiAward className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold font-manrope text-slate-900">
                  Technical Skills
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Add technologies, libraries, and tools to highlight on your public developer card.
                </p>
              </div>
            </div>

            {/* Add Skill Input */}
            <form onSubmit={handleAddSkill} className="flex gap-2.5">
              <input
                type="text"
                id="skill-input"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="e.g. TypeScript, React, Docker, GraphQL"
                disabled={skillLoading}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-sans"
              />
              <button
                id="add-skill-btn"
                type="submit"
                disabled={skillLoading || !newSkillInput.trim()}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] disabled:opacity-40 text-white px-4 py-2.5 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer shrink-0"
              >
                <FiPlus className="h-4 w-4 text-purple-400" />
                <span>Add Skill</span>
              </button>
            </form>

            {/* Skill Feedback Toast */}
            <AnimatePresence>
              {skillFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 border ${
                    skillFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {skillFeedback.type === 'success' ? (
                    <FiCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <FiAlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{skillFeedback.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Skills List */}
            <div className="pt-2">
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="group inline-flex items-center space-x-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 px-3 py-1.5 text-xs font-semibold font-manrope text-slate-800 transition-colors"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        disabled={skillLoading}
                        title={`Remove ${skill}`}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-sans italic">
                  No skills listed yet. Add your primary frameworks and programming languages above.
                </p>
              )}
            </div>
          </motion.div>

          {/* Section 3: Work Experience */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-white/80 bg-white/60 p-4 sm:p-7 md:p-8 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] space-y-6"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                  <FiBriefcase className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-manrope text-slate-900">
                    Work Experience
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Document your career positions, companies, and key achievements.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="open-add-exp-btn"
                onClick={handleOpenAddExp}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] text-white px-3.5 py-2 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer shrink-0"
              >
                <FiPlus className="h-4 w-4 text-emerald-400" />
                <span>Add Position</span>
              </button>
            </div>

            {/* Experience Feedback Toast */}
            <AnimatePresence>
              {expFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 border ${
                    expFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {expFeedback.type === 'success' ? (
                    <FiCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <FiAlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{expFeedback.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Experience List */}
            <div className="space-y-3 pt-1">
              {profile.experiences && profile.experiences.length > 0 ? (
                profile.experiences.map((exp) => (
                  <div
                    key={exp._id || exp.id}
                    className="group rounded-2xl border border-slate-200/80 bg-white/80 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold font-manrope text-slate-900">
                          {exp.title}
                        </h3>
                        <span className="text-xs text-slate-400">@</span>
                        <span className="text-xs font-semibold font-sans text-indigo-600">
                          {exp.company}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-sans">
                        {formatExpDate(exp.from)} — {formatExpDate(exp.to)}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-slate-600 font-sans pt-1 max-w-2xl leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditExp(exp)}
                        title="Edit position"
                        className="inline-flex items-center space-x-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold font-manrope text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
                      >
                        <FiEdit2 className="h-3 w-3 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExp(exp._id || exp.id || '', exp.company)
                        }
                        title="Delete position"
                        className="inline-flex items-center space-x-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold font-manrope text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer"
                      >
                        <FiTrash2 className="h-3 w-3 text-rose-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 font-sans italic border-2 border-dashed border-slate-200/80 rounded-2xl">
                  No work experience entries recorded yet. Click &quot;Add Position&quot; to begin.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Standalone ExperienceModal Dialog */}
      <ExperienceModal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        editingExp={editingExp}
        onSave={handleSaveExpModal}
        isLoading={expLoading}
      />
    </div>
  );
}
