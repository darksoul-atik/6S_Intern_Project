"use client";

import { useState } from "react";

import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";

import { FiPlus, FiTrash2, FiX } from "react-icons/fi";

import type { ProfileFormValues } from "./profile.schemas";

interface PortfolioProjectFieldsProps {
  index: number;

  projectId?: string;

  register: UseFormRegister<ProfileFormValues>;

  control: Control<ProfileFormValues>;

  setValue: UseFormSetValue<ProfileFormValues>;

  errors: FieldErrors<ProfileFormValues>;

  onRemove: () => void;
}

export function PortfolioProjectFields({
  index,
  projectId,
  register,
  control,
  setValue,
  errors,
  onRemove,
}: PortfolioProjectFieldsProps) {
  const [technologyInput, setTechnologyInput] = useState("");

  const projectError = errors.portfolioProjects?.[index];

  /*
   * Watch only this project's technologies.
   */
  const technologies =
    useWatch({
      control,
      name: `portfolioProjects.${index}.technologies`,
    }) ?? [];

  /*
  |--------------------------------------------------------------------------
  | Add technology
  |--------------------------------------------------------------------------
  */

  const handleAddTechnology = () => {
    const technology = technologyInput.trim();

    if (!technology) {
      return;
    }

    /*
     * Backend allows maximum 20.
     */
    if (technologies.length >= 20) {
      return;
    }

    /*
     * Prevent case-insensitive duplicates.
     *
     * React and react would count as duplicate.
     */
    const alreadyExists = technologies.some(
      (existing) => existing.toLowerCase() === technology.toLowerCase(),
    );

    if (alreadyExists) {
      return;
    }

    setValue(
      `portfolioProjects.${index}.technologies`,
      [...technologies, technology],
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );

    setTechnologyInput("");
  };

  /*
  |--------------------------------------------------------------------------
  | Remove technology
  |--------------------------------------------------------------------------
  */

  const handleRemoveTechnology = (technologyIndex: number) => {
    const updated = technologies.filter(
      (_, currentIndex) => currentIndex !== technologyIndex,
    );

    setValue(`portfolioProjects.${index}.technologies`, updated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  /*
   * Let Enter add a tag instead of submitting
   * the entire profile form.
   */
  const handleTechnologyKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    handleAddTechnology();
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 sm:p-5 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold font-manrope text-slate-900">
            Project {index + 1}
          </h3>

          <p className="text-[11px] text-slate-400 font-mono mt-1 break-all">
            {projectId ? `Saved project: ${projectId}` : "New unsaved project"}
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold font-manrope text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer"
        >
          <FiTrash2 className="h-3.5 w-3.5" />

          <span>Remove</span>
        </button>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor={`project-title-${index}`}
          className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
        >
          Project Title *
        </label>

        <input
          id={`project-title-${index}`}
          type="text"
          {...register(`portfolioProjects.${index}.title` as const)}
          placeholder="e.g. DevPulse"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />

        {projectError?.title && (
          <p className="mt-1.5 text-xs font-medium text-rose-600">
            {projectError.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor={`project-description-${index}`}
          className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
        >
          Description *
        </label>

        <textarea
          id={`project-description-${index}`}
          rows={4}
          {...register(`portfolioProjects.${index}.description` as const)}
          placeholder="Describe what this project does..."
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />

        {projectError?.description && (
          <p className="mt-1.5 text-xs font-medium text-rose-600">
            {projectError.description.message}
          </p>
        )}
      </div>

      {/* Technologies */}
      <div>
        <label
          htmlFor={`project-technology-${index}`}
          className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
        >
          Technologies *
        </label>

        <div className="flex gap-2">
          <input
            id={`project-technology-${index}`}
            type="text"
            value={technologyInput}
            onChange={(e) => setTechnologyInput(e.target.value)}
            onKeyDown={handleTechnologyKeyDown}
            placeholder="e.g. React"
            maxLength={50}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />

          <button
            type="button"
            onClick={handleAddTechnology}
            disabled={!technologyInput.trim() || technologies.length >= 20}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] disabled:opacity-40 text-white px-3.5 py-2.5 text-xs font-semibold font-manrope transition-all cursor-pointer"
          >
            <FiPlus className="h-4 w-4 text-blue-400" />

            <span>Add</span>
          </button>
        </div>

        {/* Technology chips */}
        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {technologies.map((technology, technologyIndex) => (
              <span
                key={`${technology}-${technologyIndex}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700"
              >
                {technology}

                <button
                  type="button"
                  onClick={() => handleRemoveTechnology(technologyIndex)}
                  aria-label={`Remove ${technology}`}
                  title={`Remove ${technology}`}
                  className="text-blue-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            {projectError?.technologies && (
              <p className="text-xs font-medium text-rose-600">
                {projectError.technologies.message}
              </p>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            {technologies.length}/20
          </span>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label
            htmlFor={`project-start-date-${index}`}
            className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
          >
            Start Month *
          </label>

          <input
            id={`project-start-date-${index}`}
            type="month"
            {...register(`portfolioProjects.${index}.startDate` as const)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />

          {projectError?.startDate && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">
              {projectError.startDate.message}
            </p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor={`project-end-date-${index}`}
            className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
          >
            End Month
          </label>

          <input
            id={`project-end-date-${index}`}
            type="month"
            {...register(`portfolioProjects.${index}.endDate` as const)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />

          {projectError?.endDate && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">
              {projectError.endDate.message}
            </p>
          )}
        </div>
      </div>

      {/* Current Project */}
      <label className="inline-flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          {...register(`portfolioProjects.${index}.isCurrent` as const)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />

        <span className="text-xs font-semibold text-slate-700">
          I am currently working on this project
        </span>
      </label>

      <p className="text-[11px] text-slate-400">
        Project URLs will be added in the next step.
      </p>
    </div>
  );
}
