'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiUser,
  FiAward,
  FiPlus,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiBriefcase,
  FiSave,
  FiEdit3,
  FiTrash2,
  FiCalendar,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/lib/api';
import type { UserProfile, Experience } from '@/types/profile';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProfilePage({ params }: EditPageProps) {
  const resolvedParams = use(params);
  const targetId = resolvedParams.id;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Basic Profile Edit State
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Skills Edit State
  const [newSkillInput, setNewSkillInput] = useState('');
  const [skillLoading, setSkillLoading] = useState(false);
  const [skillFeedback, setSkillFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Experience Edit State
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expFrom, setExpFrom] = useState('');
  const [expTo, setExpTo] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expLoading, setExpLoading] = useState(false);
  const [expError, setExpError] = useState<string | null>(null);
  const [expFeedback, setExpFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

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
          setName(res.data.name || '');
        }
      } catch (err) {
        if (active) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('Failed to load profile for editing');
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

  // Target Profile ID resolution (with fallback to _id or currentUser.id)
  const profileId =
    profile?.id || profile?._id || (targetId !== 'me' ? targetId : currentUser?.id);

  // Authorization check
  const isOwner =
    currentUser && (currentUser.id === profileId || targetId === 'me');
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isOwner || isAdmin;

  // Save basic profile name
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

    const endpoint =
      targetId === 'me' ? '/api/users/me' : `/api/users/${profileId}`;

    try {
      const res = await apiClient<UserProfile>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.data) {
        setProfile(res.data);
        setNameSuccess(true);
        setTimeout(() => setNameSuccess(false), 3000);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setNameError(err.message);
      } else {
        setNameError('Failed to update name');
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

    setSkillLoading(true);
    setSkillFeedback(null);

    // Optimistic update
    const previousSkills = [...(profile.skills || [])];
    setProfile({
      ...profile,
      skills: [...previousSkills, trimmedSkill],
    });
    setNewSkillInput('');

    const endpoint =
      targetId === 'me'
        ? '/api/users/me/skills'
        : `/api/users/${profileId}/skills`;

    try {
      const res = await apiClient<UserProfile>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ skill: trimmedSkill }),
      });
      if (res.data) {
        setProfile(res.data);
        setSkillFeedback({
          type: 'success',
          message: `Added skill "${trimmedSkill}"`,
        });
        setTimeout(() => setSkillFeedback(null), 3000);
      }
    } catch (err) {
      // Rollback on error
      setProfile({ ...profile, skills: previousSkills });
      const msg =
        err instanceof ApiError ? err.message : 'Failed to add skill';
      setSkillFeedback({ type: 'error', message: msg });
      setTimeout(() => setSkillFeedback(null), 3500);
    } finally {
      setSkillLoading(false);
    }
  };

  // Remove Skill
  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!profile) return;

    // Optimistic update
    const previousSkills = [...(profile.skills || [])];
    setProfile({
      ...profile,
      skills: previousSkills.filter((s) => s !== skillToRemove),
    });

    const endpoint =
      targetId === 'me'
        ? `/api/users/me/skills/${encodeURIComponent(skillToRemove)}`
        : `/api/users/${profileId}/skills/${encodeURIComponent(skillToRemove)}`;

    try {
      const res = await apiClient<UserProfile>(endpoint, {
        method: 'DELETE',
      });
      if (res.data) {
        setProfile(res.data);
        setSkillFeedback({
          type: 'success',
          message: `Removed skill "${skillToRemove}"`,
        });
        setTimeout(() => setSkillFeedback(null), 3000);
      }
    } catch (err) {
      // Rollback on error
      setProfile({ ...profile, skills: previousSkills });
      const msg =
        err instanceof ApiError ? err.message : 'Failed to remove skill';
      setSkillFeedback({ type: 'error', message: msg });
      setTimeout(() => setSkillFeedback(null), 3500);
    }
  };

  // Open Add Experience Modal
  const handleOpenAddExp = () => {
    setEditingExp(null);
    setExpTitle('');
    setExpCompany('');
    setExpFrom('');
    setExpTo('');
    setExpDescription('');
    setExpError(null);
    setIsExpModalOpen(true);
  };

  // Open Edit Experience Modal
  const handleOpenEditExp = (exp: Experience) => {
    setEditingExp(exp);
    setExpTitle(exp.title);
    setExpCompany(exp.company);
    setExpFrom(exp.from);
    setExpTo(exp.to || '');
    setExpDescription(exp.description || '');
    setExpError(null);
    setIsExpModalOpen(true);
  };

  // Save Experience (Create or Update)
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
      to: expTo.trim() || undefined,
      description: expDescription.trim() || undefined,
    };

    try {
      if (editingExp) {
        // Update experience
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
        // Add new experience
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

    // Optimistic remove
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

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center backdrop-blur-2xl shadow-xl space-y-4">
          <div
            className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold font-mono shadow-sm ${
              is401
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            {is401 ? '401' : is404 ? '404' : '!'}
          </div>
          <h2 className="text-xl font-bold font-manrope text-slate-900">
            {is401
              ? 'Authentication Required'
              : is404
              ? 'Developer Not Found'
              : 'Error Accessing Profile'}
          </h2>
          <p className="text-sm text-slate-600 font-sans leading-relaxed">
            {is401
              ? 'Please sign in to your DevPulse account to edit this profile.'
              : is404
              ? 'The developer profile you are attempting to edit does not exist or has been removed.'
              : error || 'Unable to access profile for editing.'}
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

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full rounded-3xl border border-amber-200/80 bg-white/90 p-8 text-center backdrop-blur-2xl shadow-xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto text-xl font-bold font-mono shadow-sm">
            403
          </div>
          <h2 className="text-xl font-bold font-manrope text-slate-900">
            Permission Denied (403)
          </h2>
          <p className="text-sm text-slate-600 font-sans leading-relaxed">
            You do not have administrative or owner permissions to modify this developer profile.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/profile/${profileId || 'me'}`}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 text-white px-5 py-2.5 text-xs font-semibold hover:bg-slate-800 transition-all shadow-xs"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>View Public Profile</span>
            </Link>
          </div>
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
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Header Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href={`/profile/${profileId || 'me'}`}
              className="inline-flex items-center space-x-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/70 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-xs transition-all"
            >
              <FiArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Profile View</span>
            </Link>

            <span className="text-xs font-mono text-slate-500 bg-white/60 px-3 py-1.5 rounded-xl border border-slate-200/60">
              Editing: {profileId || 'My Profile'}
            </span>
          </div>

          {/* Edit Profile Heading Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/80 bg-white/65 p-6 sm:p-8 backdrop-blur-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope text-slate-900">
                Edit Developer Profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-sans">
                Update your display name, manage your core skills, and list your work experiences.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`text-[11px] uppercase font-bold font-mono tracking-wider px-3 py-1 rounded-full ${
                  profile.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                }`}
              >
                {profile.role}
              </span>
            </div>
          </motion.div>

          {/* Section 1: Basic Info (Name) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] space-y-4"
          >
            <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <FiUser className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold font-manrope text-slate-900">
                Basic Information
              </h2>
            </div>

            <form onSubmit={handleSaveName} className="space-y-4 pt-1">
              <div>
                <label
                  htmlFor="profile-name-input"
                  className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
                >
                  Full Display Name
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    id="profile-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Alex Chen"
                    className="flex-1 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                  />
                  <button
                    id="save-profile-name-btn"
                    type="submit"
                    disabled={savingName || name.trim() === profile.name}
                    className="inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-semibold font-manrope shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <FiSave className="h-4 w-4" />
                    <span>{savingName ? 'Saving...' : 'Save Name'}</span>
                  </button>
                </div>
              </div>

              {/* Feedback messages */}
              <AnimatePresence>
                {nameSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center space-x-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-xl p-3"
                  >
                    <FiCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Display name updated successfully!</span>
                  </motion.div>
                )}
                {nameError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center space-x-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl p-3"
                  >
                    <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{nameError}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Section 2: Skills Management */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] space-y-5"
          >
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                <FiAward className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold font-manrope text-slate-900">
                  Developer Skills & Technologies
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Add or remove technical competencies and tools (e.g., React, Go, Docker).
                </p>
              </div>
            </div>

            {/* Add Skill Form */}
            <form onSubmit={handleAddSkill} className="space-y-3">
              <label
                htmlFor="new-skill-input"
                className="block text-xs font-semibold text-slate-700 font-manrope"
              >
                Add a new skill
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  id="new-skill-input"
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  placeholder="e.g. Next.js, Kubernetes, GraphQL"
                  className="flex-1 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-sans"
                />
                <button
                  id="add-skill-btn"
                  type="submit"
                  disabled={skillLoading || !newSkillInput.trim()}
                  className="inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-semibold font-manrope shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>{skillLoading ? 'Adding...' : 'Add Skill'}</span>
                </button>
              </div>

              {/* Skill feedback notification */}
              <AnimatePresence>
                {skillFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`flex items-center space-x-2 text-xs font-medium rounded-xl p-3 border ${
                      skillFeedback.type === 'success'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-rose-700 bg-rose-50 border-rose-200'
                    }`}
                  >
                    {skillFeedback.type === 'success' ? (
                      <FiCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    )}
                    <span>{skillFeedback.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Current Skills List Chips */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 font-manrope mb-2">
                Active Skills
              </label>

              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/95 text-xs font-medium font-mono text-slate-800 border border-slate-200 shadow-2xs group hover:border-purple-300 hover:shadow-xs transition-all"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        aria-label={`Remove skill ${skill}`}
                        onClick={() => handleRemoveSkill(skill)}
                        className="rounded-md p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500 font-sans">
                  No skills added yet. Use the input field above to add your first skill.
                </div>
              )}
            </div>
          </motion.div>

          {/* Section 3: Work Experiences Management */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                  <FiBriefcase className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-manrope text-slate-900">
                    Work Experiences
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Track and showcase your career progression, job roles, and contributions.
                  </p>
                </div>
              </div>

              <button
                id="open-add-exp-btn"
                type="button"
                onClick={handleOpenAddExp}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold font-manrope shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <FiPlus className="h-4 w-4" />
                <span>Add Experience</span>
              </button>
            </div>

            {/* Experience Feedback Notification */}
            <AnimatePresence>
              {expFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`flex items-center space-x-2 text-xs font-medium rounded-xl p-3 border ${
                    expFeedback.type === 'success'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200'
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

            {/* Experiences List */}
            {profile.experiences && profile.experiences.length > 0 ? (
              <div className="space-y-4 pt-1">
                {profile.experiences.map((exp) => {
                  const expId = exp._id || exp.id || '';
                  return (
                    <div
                      key={expId}
                      className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-emerald-200 transition-all"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold font-manrope text-slate-900">
                            {exp.title}
                          </h3>
                          <span className="text-xs font-semibold text-emerald-600 font-sans">
                            @{exp.company}
                          </span>
                        </div>

                        <div className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-slate-500 bg-slate-100/80 px-2.5 py-0.5 rounded-lg">
                          <FiCalendar className="h-3 w-3 text-slate-400" />
                          <span>
                            {exp.from} – {exp.to || 'Present'}
                          </span>
                        </div>

                        {exp.description && (
                          <p className="text-xs text-slate-600 font-sans leading-relaxed pt-1">
                            {exp.description}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 self-end sm:self-start">
                        <button
                          type="button"
                          aria-label="Edit experience"
                          onClick={() => handleOpenEditExp(exp)}
                          className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 text-slate-700 hover:text-indigo-600 px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer"
                        >
                          <FiEdit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          aria-label="Delete experience"
                          onClick={() => handleDeleteExp(expId, exp.company)}
                          className="inline-flex items-center space-x-1 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 hover:border-rose-300 text-rose-700 px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
                <p className="text-xs text-slate-500 font-sans">
                  No work experience listed yet.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddExp}
                  className="inline-block text-xs font-semibold text-emerald-600 hover:text-emerald-500 hover:underline cursor-pointer"
                >
                  + Add your first work experience
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Experience Form Modal (Add / Edit) */}
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
              className="relative w-full max-w-lg rounded-3xl border border-white/80 bg-white p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-5 text-left"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="exp-from-input"
                      className="block text-xs font-semibold text-slate-700 mb-1 font-manrope"
                    >
                      Start Date *
                    </label>
                    <input
                      id="exp-from-input"
                      type="text"
                      value={expFrom}
                      onChange={(e) => setExpFrom(e.target.value)}
                      required
                      placeholder="e.g. 2022-01"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="exp-to-input"
                      className="block text-xs font-semibold text-slate-700 mb-1 font-manrope"
                    >
                      End Date
                    </label>
                    <input
                      id="exp-to-input"
                      type="text"
                      value={expTo}
                      onChange={(e) => setExpTo(e.target.value)}
                      placeholder="e.g. Present, 2024-05"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                    />
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
