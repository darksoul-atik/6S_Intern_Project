/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";

import { useFieldArray, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  FiAlertCircle,
  FiArrowLeft,
  FiAward,
  FiBriefcase,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiEdit2,
  FiPlus,
  FiShield,
  FiTrash2,
  FiUser,
} from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { compressImage } from "@/lib/image";

import { formatExpDate, getInitials } from "@/lib/formatters";

import {
  useUserProfile,
  useUpdateProfileMutation,
  useCreatePortfolioProjectMutation,
  useUpdatePortfolioProjectMutation,
  useDeletePortfolioProjectMutation,
  useAddSkillMutation,
  useRemoveSkillMutation,
  useAddExperienceMutation,
  useUpdateExperienceMutation,
  useDeleteExperienceMutation,
  type UserProfile,
  type Experience,
  type ExperiencePayload,
} from "./users.api";

import { profileFormSchema, type ProfileFormValues } from "./profile.schemas";

import { ProfileSkeleton } from "./ProfileSkeleton";
import { ExperienceModal } from "./ExperienceModal";
import { PortfolioProjectFields } from "./PortfolioProjectFields";

/*
|--------------------------------------------------------------------------
| Backend Profile -> RHF Form Values
|--------------------------------------------------------------------------
|
| We use the exact same mapping:
|
| initial page load
| portfolio save success
| partial save recovery
|
| This is important because newly POSTed projects receive their
| real backend projectId after refetch.
|--------------------------------------------------------------------------
*/

function profileToFormValues(profile: UserProfile): ProfileFormValues {
  return {
    name: profile.name ?? "",

    headline: profile.headline ?? "",

    bio: profile.bio ?? "",

    avatarUrl: profile.avatarUrl ?? "",

    portfolioProjects:
      profile.portfolioProjects?.map((project) => ({
        /*
         * Real backend project identity.
         *
         * NOT React Hook Form field.id.
         */
        projectId: project.id ?? project._id,

        title: project.title ?? "",

        description: project.description ?? "",

        urls: project.urls ?? [],

        technologies: project.technologies ?? [],

        startDate: project.startDate ?? "",

        /*
         * Browser form representation:
         *
         * Current projects use "".
         *
         * When sending to API,
         * endDate is omitted entirely
         * if isCurrent === true.
         */
        endDate: project.endDate ?? "",

        isCurrent: project.isCurrent ?? false,
      })) ?? [],
  };
}

export function ProfileEditForm() {
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

    /*
     * Task 12:
     *
     * After portfolio mutations finish,
     * fetch fresh canonical profile data.
     */
    refetch: refetchProfile,
  } = useUserProfile("me");

  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Failed to load profile for editing"
    : null;

  /*
  |--------------------------------------------------------------------------
  | Mutations
  |--------------------------------------------------------------------------
  */

  const updateProfileMutation = useUpdateProfileMutation("me");

  const createPortfolioProjectMutation = useCreatePortfolioProjectMutation();

  const updatePortfolioProjectMutation = useUpdatePortfolioProjectMutation();

  const deletePortfolioProjectMutation = useDeletePortfolioProjectMutation();

  const addSkillMutation = useAddSkillMutation();

  const removeSkillMutation = useRemoveSkillMutation();

  const addExperienceMutation = useAddExperienceMutation();

  const updateExperienceMutation = useUpdateExperienceMutation();

  const deleteExperienceMutation = useDeleteExperienceMutation();

  const portfolioSaving =
    createPortfolioProjectMutation.isPending ||
    updatePortfolioProjectMutation.isPending ||
    deletePortfolioProjectMutation.isPending;

  /*
  |--------------------------------------------------------------------------
  | React Hook Form
  |--------------------------------------------------------------------------
  */

  const {
    register,
    reset,
    setValue,
    getValues,
    watch,
    control,
    trigger,

    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),

    defaultValues: {
      name: "",
      headline: "",
      bio: "",
      avatarUrl: "",
      portfolioProjects: [],
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Portfolio Projects Field Array
  |--------------------------------------------------------------------------
  */

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
  } = useFieldArray({
    control,
    name: "portfolioProjects",
  });

  /*
  |--------------------------------------------------------------------------
  | Projects Pending Backend Deletion
  |--------------------------------------------------------------------------
  */

  const [pendingDeletedProjectIds, setPendingDeletedProjectIds] = useState<
    string[]
  >([]);

  /*
  |--------------------------------------------------------------------------
  | Watched Basic Profile Values
  |--------------------------------------------------------------------------
  */

  const watchedName = watch("name");

  const watchedAvatarUrl = watch("avatarUrl");

  const watchedBio = watch("bio");

  /*
  |--------------------------------------------------------------------------
  | Project Actions
  |--------------------------------------------------------------------------
  */

  const handleAddProject = () => {
    appendProject({
      title: "",
      description: "",
      urls: [],
      technologies: [],
      startDate: "",
      endDate: "",
      isCurrent: false,
    });
  };

  const handleRemoveProject = (index: number, projectId?: string) => {
    const projectTitle = getValues(`portfolioProjects.${index}.title`)?.trim();

    const projectLabel = projectTitle || `Project ${index + 1}`;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${projectLabel}"?`,
    );

    if (!confirmed) {
      return;
    }

    /*
     * Existing project.
     *
     * Queue backend ID.
     */
    if (projectId) {
      setPendingDeletedProjectIds((currentIds) => {
        if (currentIds.includes(projectId)) {
          return currentIds;
        }

        return [...currentIds, projectId];
      });
    }

    /*
     * Remove from current RHF UI.
     */
    removeProject(index);
  };

  /*
  |--------------------------------------------------------------------------
  | Profile UI State
  |--------------------------------------------------------------------------
  */

  const [avatarUploading, setAvatarUploading] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState(false);

  const [profileError, setProfileError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Portfolio UI State
  |--------------------------------------------------------------------------
  */

  const [portfolioSuccess, setPortfolioSuccess] = useState(false);

  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /*
   * Normal background refetch must not
   * wipe unsaved edits.
   *
   * Task 12 manual reset happens separately
   * after an intentional save.
   */
  const hasHydratedProfileRef = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Initial Profile Hydration
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!profile || hasHydratedProfileRef.current) {
      return;
    }

    reset(profileToFormValues(profile));

    hasHydratedProfileRef.current = true;
  }, [profile, reset]);

  /*
  |--------------------------------------------------------------------------
  | Skills State
  |--------------------------------------------------------------------------
  */

  const [newSkillInput, setNewSkillInput] = useState("");

  const [skillFeedback, setSkillFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const skillLoading =
    addSkillMutation.isPending || removeSkillMutation.isPending;

  /*
  |--------------------------------------------------------------------------
  | Experience State
  |--------------------------------------------------------------------------
  */

  const [isExpModalOpen, setIsExpModalOpen] = useState(false);

  const [editingExp, setEditingExp] = useState<Experience | null>(null);

  const [expFeedback, setExpFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const expLoading =
    addExperienceMutation.isPending ||
    updateExperienceMutation.isPending ||
    deleteExperienceMutation.isPending;

  /*
  |--------------------------------------------------------------------------
  | Avatar
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
      setProfileError("Please select a valid image file (PNG, JPG, WebP)");

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Image size should be less than 5MB");

      return;
    }

    setAvatarUploading(true);
    setProfileError(null);

    try {
      const dataUrl = await compressImage(file, 400, 0.88);

      setValue("avatarUrl", dataUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch {
      setProfileError("Failed to process image");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setValue("avatarUrl", "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Build Project API Payload
  |--------------------------------------------------------------------------
  */

  const buildPortfolioProjectPayload = (
    project: ProfileFormValues["portfolioProjects"][number],
  ) => {
    const payload = {
      title: project.title.trim(),

      description: project.description.trim(),

      urls: project.urls.map((url) => url.trim()).filter(Boolean),

      technologies: project.technologies
        .map((technology) => technology.trim())
        .filter(Boolean),

      startDate: project.startDate,

      isCurrent: project.isCurrent,
    };

    /*
     * Current projects:
     *
     * endDate must NOT exist.
     */
    if (project.isCurrent) {
      return payload;
    }

    return {
      ...payload,

      endDate: project.endDate?.trim() ?? "",
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Save Basic Profile Only
  |--------------------------------------------------------------------------
  */

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setProfileError(null);
    setProfileSuccess(false);

    /*
     * Validate basic profile only.
     */
    const isValid = await trigger(["name", "headline", "bio", "avatarUrl"]);

    if (!isValid) {
      return;
    }

    const values = getValues();

    try {
      await updateProfileMutation.mutateAsync({
        name: values.name.trim(),

        headline: values.headline.trim() === "" ? null : values.headline.trim(),

        bio: values.bio.trim() === "" ? null : values.bio.trim(),

        avatarUrl: values.avatarUrl.trim() === "" ? null : values.avatarUrl,
      });

      setProfileSuccess(true);

      setTimeout(() => {
        setProfileSuccess(false);
      }, 3000);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to update profile details";

      setProfileError(message);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Task 12 - Canonical Portfolio Recovery
  |--------------------------------------------------------------------------
  |
  | Fetch the profile from the backend and
  | completely replace the local portfolio form
  | with the server's canonical state.
  |
  | This solves:
  |
  | - new project missing projectId after POST
  | - stale deleted projects
  | - stale updated project data
  | - partial-save failure inconsistencies
  |--------------------------------------------------------------------------
  */

  const refreshCanonicalProfile = async () => {
    const result = await refetchProfile();

    if (!result.data) {
      throw new Error("Could not refresh the saved profile.");
    }

    reset(profileToFormValues(result.data));

    /*
     * RHF now matches backend state.
     *
     * Any previously queued deletion
     * state is no longer necessary.
     */
    setPendingDeletedProjectIds([]);

    return result.data;
  };

  /*
  |--------------------------------------------------------------------------
  | Task 11 + Task 12 - Save Portfolio
  |--------------------------------------------------------------------------
  */

  const handleSavePortfolio = async () => {
    setPortfolioError(null);
    setPortfolioSuccess(false);

    /*
     * Validate portfolio only.
     */
    const isValid = await trigger("portfolioProjects");

    if (!isValid) {
      setPortfolioError(
        "Please fix the project validation errors before saving.",
      );

      return;
    }

    const projects = getValues("portfolioProjects");

    /*
      |--------------------------------------------------------------------------
      | Phase 1 - Perform Writes
      |--------------------------------------------------------------------------
      */

    try {
      /*
        |--------------------------------------------------------------------------
        | DELETE persisted projects
        |--------------------------------------------------------------------------
        */

      for (const projectId of pendingDeletedProjectIds) {
        await deletePortfolioProjectMutation.mutateAsync(projectId);
      }

      /*
        |--------------------------------------------------------------------------
        | PATCH existing / POST new
        |--------------------------------------------------------------------------
        */

      for (const project of projects) {
        const payload = buildPortfolioProjectPayload(project);

        /*
         * Existing project.
         */
        if (project.projectId) {
          await updatePortfolioProjectMutation.mutateAsync({
            projectId: project.projectId,

            data: payload,
          });

          continue;
        }

        /*
         * New project.
         */
        await createPortfolioProjectMutation.mutateAsync(payload);
      }
    } catch (err) {
      /*
       * One or more writes may already
       * have succeeded before another failed.
       *
       * Therefore we must refetch the
       * canonical server state.
       */
      try {
        await refreshCanonicalProfile();
      } catch {
        /*
         * Ignore secondary refresh error.
         * Show original save error below.
         */
      }

      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to save portfolio projects";

      setPortfolioError(
        `${message}. The profile was refreshed to match the server where possible.`,
      );

      return;
    }

    /*
      |--------------------------------------------------------------------------
      | Phase 2 - Task 12 Canonical Refetch
      |--------------------------------------------------------------------------
      |
      | All writes succeeded.
      |
      | Now GET /profile/me again.
      |
      | This gives new projects their real IDs.
      |--------------------------------------------------------------------------
      */

    try {
      await refreshCanonicalProfile();

      setPortfolioSuccess(true);

      setTimeout(() => {
        setPortfolioSuccess(false);
      }, 3000);
    } catch {
      /*
       * Writes succeeded but refresh failed.
       *
       * Do NOT claim save failed.
       */
      setPortfolioError(
        "Portfolio projects were saved, but the latest profile could not be refreshed. Reload the page before editing again.",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Skills
  |--------------------------------------------------------------------------
  */

  const handleAddSkill = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!profile) {
      return;
    }

    const trimmedSkill = newSkillInput.trim();

    if (!trimmedSkill) {
      return;
    }

    if (
      profile.skills?.some(
        (skill) => skill.toLowerCase() === trimmedSkill.toLowerCase(),
      )
    ) {
      setSkillFeedback({
        type: "error",

        message: `Skill "${trimmedSkill}" is already in your skills list.`,
      });

      setTimeout(() => setSkillFeedback(null), 3000);

      return;
    }

    setSkillFeedback(null);
    setNewSkillInput("");

    try {
      await addSkillMutation.mutateAsync(trimmedSkill);

      setSkillFeedback({
        type: "success",

        message: `Added skill "${trimmedSkill}"`,
      });

      setTimeout(() => setSkillFeedback(null), 3000);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to add skill";

      setSkillFeedback({
        type: "error",
        message,
      });

      setTimeout(() => setSkillFeedback(null), 3500);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!profile) {
      return;
    }

    try {
      await removeSkillMutation.mutateAsync(skillToRemove);

      setSkillFeedback({
        type: "success",

        message: `Removed skill "${skillToRemove}"`,
      });

      setTimeout(() => setSkillFeedback(null), 3000);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to remove skill";

      setSkillFeedback({
        type: "error",
        message,
      });

      setTimeout(() => setSkillFeedback(null), 3500);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Experience
  |--------------------------------------------------------------------------
  */

  const handleOpenAddExp = () => {
    setEditingExp(null);
    setIsExpModalOpen(true);
  };

  const handleOpenEditExp = (experience: Experience) => {
    setEditingExp(experience);

    setIsExpModalOpen(true);
  };

  const handleSaveExpModal = async (payload: ExperiencePayload) => {
    if (editingExp) {
      const experienceId = editingExp._id || editingExp.id!;

      await updateExperienceMutation.mutateAsync({
        id: experienceId,

        data: payload,
      });

      setExpFeedback({
        type: "success",

        message: `Updated experience at "${payload.company}"`,
      });

      setTimeout(() => setExpFeedback(null), 3000);
    } else {
      await addExperienceMutation.mutateAsync(payload);

      setExpFeedback({
        type: "success",

        message: `Added experience at "${payload.company}"`,
      });

      setTimeout(() => setExpFeedback(null), 3000);
    }
  };

  const handleDeleteExp = async (experienceId: string, company: string) => {
    if (!profile) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove experience at ${company}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteExperienceMutation.mutateAsync(experienceId);

      setExpFeedback({
        type: "success",

        message: `Removed experience at "${company}"`,
      });

      setTimeout(() => setExpFeedback(null), 3000);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to delete experience";

      setExpFeedback({
        type: "error",
        message,
      });

      setTimeout(() => setExpFeedback(null), 3500);
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
  | Query Error
  |--------------------------------------------------------------------------
  */

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
            {error || "Unable to load profile data for editing."}
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

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Dots */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-size-[24px_24px] opacity-60 pointer-events-none"
        aria-hidden="true"
      />

      {/* Left Glow */}
      <div
        className="absolute top-12 left-1/4 -translate-x-1/2 w-137.5 h-125 rounded-full bg-linear-to-tr from-indigo-300/35 via-blue-200/25 to-transparent blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Right Glow */}
      <div
        className="absolute top-28 right-1/4 translate-x-1/3 w-150 h-130 rounded-full bg-linear-to-bl from-purple-300/35 via-violet-200/25 to-transparent blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
          {/* Navigation */}
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

          {/* Header */}
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70"
          >
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-manrope text-slate-900">
                Edit Developer Profile
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-sans">
                Update your avatar, display name, professional headline,
                biography, portfolio, skills, and experience.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {currentUser?.role === "admin" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-manrope bg-purple-50/90 text-purple-700 border border-purple-200/90 shadow-2xs">
                  <FiShield className="h-3.5 w-3.5 text-purple-600 shrink-0" />

                  <span>Administrator</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-manrope bg-slate-100/90 text-slate-700 border border-slate-200/90 shadow-2xs">
                  <FiCheckCircle className="h-3.5 w-3.5 text-indigo-600 shrink-0" />

                  <span>Verified User</span>
                </span>
              )}
            </div>
          </motion.div>

          {/* Profile Details */}
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
            }}
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
                  Manage your avatar, display name, professional headline, and
                  biography.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 pt-1">
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="relative group">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-tr from-indigo-600 via-purple-600 to-emerald-500 p-0.5 shadow-sm overflow-hidden">
                      {watchedAvatarUrl ? (
                        <img
                          src={watchedAvatarUrl}
                          alt="Avatar preview"
                          className="h-full w-full object-cover rounded-[14px]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-900 text-white font-manrope font-bold text-xl tracking-tight">
                          {getInitials(watchedName || profile.name)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 w-20">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />

                    <button
                      type="button"
                      disabled={avatarUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 inline-flex items-center justify-center h-8 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] shadow-md hover:shadow-lg hover:border-indigo-500/40 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <FiCamera className="h-3.5 w-3.5 text-indigo-400" />
                    </button>

                    {watchedAvatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="flex-1 inline-flex items-center justify-center h-8 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] shadow-md hover:border-red-500/40 transition-all cursor-pointer"
                      >
                        <FiTrash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 flex-1">
                  <h3 className="text-xs font-bold font-manrope text-slate-900">
                    Profile Picture / Avatar
                  </h3>

                  <p className="text-xs text-slate-500 font-sans">
                    Upload an avatar image (PNG, JPG, WebP max 5MB).
                  </p>

                  {errors.avatarUrl && (
                    <p className="text-xs font-medium text-rose-600">
                      {errors.avatarUrl.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Name + Headline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope">
                    Full Display Name *
                  </label>

                  <input
                    {...register("name")}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                  />

                  {errors.name && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope">
                    Professional Headline
                  </label>

                  <input
                    {...register("headline")}
                    placeholder="e.g. Senior Full-Stack Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                  />

                  {errors.headline && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      {errors.headline.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope">
                  Bio
                </label>

                <textarea
                  {...register("bio")}
                  rows={5}
                  placeholder="Tell other developers about yourself..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                />

                <div className="mt-1.5 flex items-start justify-between gap-3">
                  {errors.bio ? (
                    <p className="text-xs font-medium text-rose-600">
                      {errors.bio.message}
                    </p>
                  ) : (
                    <span />
                  )}

                  <span className="text-[11px] text-slate-400">
                    {watchedBio?.length ?? 0}
                    /2000
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {profileError && (
                  <motion.div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center space-x-2">
                    <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />

                    <span>{profileError}</span>
                  </motion.div>
                )}

                {profileSuccess && (
                  <motion.div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 flex items-center space-x-2">
                    <FiCheck className="h-4 w-4 shrink-0 text-emerald-600" />

                    <span>Profile details updated successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending || avatarUploading}
                  className="inline-flex items-center space-x-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] disabled:opacity-50 text-white px-5 py-2.5 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-indigo-500/40 transition-all cursor-pointer"
                >
                  <FiCheck className="h-4 w-4 text-indigo-400" />

                  <span>
                    {updateProfileMutation.isPending
                      ? "Saving Changes..."
                      : "Save Profile Details"}
                  </span>
                </button>
              </div>
            </form>
          </motion.div>

          {/* Portfolio Projects */}
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.15,
            }}
            className="rounded-3xl border border-white/80 bg-white/60 p-4 sm:p-7 md:p-8 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.8)] space-y-6"
          >
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <FiBriefcase className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-base font-bold font-manrope text-slate-900">
                    Portfolio Projects
                  </h2>

                  <p className="text-xs text-slate-500 font-sans">
                    Add projects that demonstrate your work and technologies.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddProject}
                disabled={portfolioSaving}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] disabled:opacity-40 text-white px-3.5 py-2 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer shrink-0"
              >
                <FiPlus className="h-4 w-4 text-blue-400" />

                <span>Add Project</span>
              </button>
            </div>

            {projectFields.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-sans italic border-2 border-dashed border-slate-200/80 rounded-2xl">
                No portfolio projects yet. Click &quot;Add Project&quot; to
                begin.
              </div>
            ) : (
              <div className="space-y-4">
                {projectFields.map((field, index) => (
                  <PortfolioProjectFields
                    key={field.id}
                    index={index}
                    register={register}
                    control={control}
                    setValue={setValue}
                    errors={errors}
                    onRemove={() => handleRemoveProject(index, field.projectId)}
                  />
                ))}
              </div>
            )}

            {/* Pending Deletes */}
            {pendingDeletedProjectIds.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800 flex items-center space-x-2">
                <FiAlertCircle className="h-4 w-4 shrink-0 text-amber-600" />

                <span>
                  {pendingDeletedProjectIds.length} saved{" "}
                  {pendingDeletedProjectIds.length === 1
                    ? "project is"
                    : "projects are"}{" "}
                  marked for deletion. Click &quot;Save Portfolio Projects&quot;
                  to apply the deletion.
                </span>
              </div>
            )}

            {/* Portfolio Feedback */}
            <AnimatePresence>
              {portfolioError && (
                <motion.div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center space-x-2">
                  <FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600" />

                  <span>{portfolioError}</span>
                </motion.div>
              )}

              {portfolioSuccess && (
                <motion.div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 flex items-center space-x-2">
                  <FiCheck className="h-4 w-4 shrink-0 text-emerald-600" />

                  <span>Portfolio projects saved successfully!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Portfolio */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSavePortfolio}
                disabled={portfolioSaving}
                className="inline-flex items-center space-x-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] disabled:opacity-50 text-white px-5 py-2.5 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer"
              >
                <FiCheck className="h-4 w-4 text-blue-400" />

                <span>
                  {portfolioSaving
                    ? "Saving Projects..."
                    : "Save Portfolio Projects"}
                </span>
              </button>
            </div>
          </motion.div>

          {/* Technical Skills */}
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
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
                  Add technologies, libraries, and tools to highlight on your
                  public developer card.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSkill} className="flex gap-2.5">
              <input
                type="text"
                value={newSkillInput}
                onChange={(event) => setNewSkillInput(event.target.value)}
                placeholder="e.g. TypeScript, React, Docker, GraphQL"
                disabled={skillLoading}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-sans"
              />

              <button
                type="submit"
                disabled={skillLoading || !newSkillInput.trim()}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] disabled:opacity-40 text-white px-4 py-2.5 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer shrink-0"
              >
                <FiPlus className="h-4 w-4 text-purple-400" />

                <span>Add Skill</span>
              </button>
            </form>

            <AnimatePresence>
              {skillFeedback && (
                <motion.div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 border ${
                    skillFeedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {skillFeedback.type === "success" ? (
                    <FiCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <FiAlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}

                  <span>{skillFeedback.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

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
                        className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 rounded cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-sans italic">
                  No skills listed yet.
                </p>
              )}
            </div>
          </motion.div>

          {/* Work Experience */}
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.25,
            }}
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
                    Document your career positions, companies, and key
                    achievements.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddExp}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] text-white px-3.5 py-2 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer shrink-0"
              >
                <FiPlus className="h-4 w-4 text-emerald-400" />

                <span>Add Position</span>
              </button>
            </div>

            <AnimatePresence>
              {expFeedback && (
                <motion.div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 border ${
                    expFeedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {expFeedback.type === "success" ? (
                    <FiCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <FiAlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}

                  <span>{expFeedback.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3 pt-1">
              {profile.experiences && profile.experiences.length > 0 ? (
                profile.experiences.map((experience) => (
                  <div
                    key={experience._id || experience.id}
                    className="group rounded-2xl border border-slate-200/80 bg-white/80 p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold font-manrope text-slate-900">
                          {experience.title}
                        </h3>

                        <span className="text-xs text-slate-400">@</span>

                        <span className="text-xs font-semibold font-sans text-indigo-600">
                          {experience.company}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-sans">
                        {formatExpDate(experience.from)} —{" "}
                        {formatExpDate(experience.to)}
                      </p>

                      {experience.description && (
                        <p className="text-xs text-slate-600 font-sans pt-1 max-w-2xl leading-relaxed">
                          {experience.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditExp(experience)}
                        className="inline-flex items-center space-x-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold font-manrope text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
                      >
                        <FiEdit2 className="h-3 w-3 text-slate-500" />

                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExp(
                            experience._id || experience.id || "",
                            experience.company,
                          )
                        }
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
                  No work experience entries recorded yet. Click &quot;Add
                  Position&quot; to begin.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

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
