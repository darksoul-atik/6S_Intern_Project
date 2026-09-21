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

import type { ProfileFormValues } from "../schemas/user-schema";

interface PortfolioProjectFieldsProps {
  index: number;

  register: UseFormRegister<ProfileFormValues>;
  control: Control<ProfileFormValues>;
  setValue: UseFormSetValue<ProfileFormValues>;

  errors: FieldErrors<ProfileFormValues>;

  onRemove: () => void;
}

/*
|--------------------------------------------------------------------------
| Nested Error Helper
|--------------------------------------------------------------------------
*/

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (
      error as {
        message?: unknown;
      }
    ).message;

    if (typeof message === "string") {
      return message;
    }
  }

  if (Array.isArray(error)) {
    for (const item of error) {
      const message = getErrorMessage(item);

      if (message) {
        return message;
      }
    }
  }

  return null;
}

export function PortfolioProjectFields({
  index,
  register,
  control,
  setValue,
  errors,
  onRemove,
}: PortfolioProjectFieldsProps) {
  /*
  |--------------------------------------------------------------------------
  | Local Inputs
  |--------------------------------------------------------------------------
  */

  const [technologyInput, setTechnologyInput] = useState("");

  const [urlInput, setUrlInput] = useState("");

  const [urlInputError, setUrlInputError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Errors
  |--------------------------------------------------------------------------
  */

  const projectError = errors.portfolioProjects?.[index];

  const technologyErrorMessage = getErrorMessage(projectError?.technologies);

  const urlErrorMessage = getErrorMessage(projectError?.urls);

  /*
  |--------------------------------------------------------------------------
  | Watch RHF Values
  |--------------------------------------------------------------------------
  */

  const technologies =
    useWatch({
      control,
      name: `portfolioProjects.${index}.technologies` as const,
    }) ?? [];

  const urls =
    useWatch({
      control,
      name: `portfolioProjects.${index}.urls` as const,
    }) ?? [];

  const isCurrent =
    useWatch({
      control,
      name: `portfolioProjects.${index}.isCurrent` as const,
    }) ?? false;

  /*
  |--------------------------------------------------------------------------
  | Technologies
  |--------------------------------------------------------------------------
  */

  const handleAddTechnology = () => {
    const technology = technologyInput.trim();

    if (!technology) {
      return;
    }

    if (technologies.length >= 20) {
      return;
    }

    const duplicate = technologies.some(
      (existing) => existing.toLowerCase() === technology.toLowerCase(),
    );

    if (duplicate) {
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

  const handleRemoveTechnology = (technologyIndex: number) => {
    const updatedTechnologies = technologies.filter(
      (_, currentIndex) => currentIndex !== technologyIndex,
    );

    setValue(`portfolioProjects.${index}.technologies`, updatedTechnologies, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleTechnologyKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    handleAddTechnology();
  };

  /*
  |--------------------------------------------------------------------------
  | URLs
  |--------------------------------------------------------------------------
  */

  const handleAddUrl = () => {
    const url = urlInput.trim();

    setUrlInputError(null);

    if (!url) {
      return;
    }

    if (urls.length >= 5) {
      setUrlInputError("Maximum 5 URLs are allowed.");

      return;
    }

    const duplicate = urls.some(
      (existing) => existing.toLowerCase() === url.toLowerCase(),
    );

    if (duplicate) {
      setUrlInputError("This URL has already been added.");

      return;
    }

    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        setUrlInputError("URL must start with http:// or https://");

        return;
      }
    } catch {
      setUrlInputError("Please enter a valid URL.");

      return;
    }

    setValue(`portfolioProjects.${index}.urls`, [...urls, url], {
      shouldDirty: true,
      shouldValidate: true,
    });

    setUrlInput("");
    setUrlInputError(null);
  };

  const handleRemoveUrl = (urlIndex: number) => {
    const updatedUrls = urls.filter(
      (_, currentIndex) => currentIndex !== urlIndex,
    );

    setValue(`portfolioProjects.${index}.urls`, updatedUrls, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleUrlKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    handleAddUrl();
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 sm:p-5 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold font-manrope text-slate-900">
            Project {index + 1}
          </h3>

          <p className="text-[11px] text-slate-400 mt-1">
            Add your project details, technologies and links.
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold font-manrope text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer"
        >
          <FiTrash2 className="h-3.5 w-3.5 text-rose-500" />

          <span>Delete</span>
        </button>
      </div>

      {/* Project Title */}
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
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
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
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
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

        <div className="flex gap-2.5">
          <input
            id={`project-technology-${index}`}
            type="text"
            value={technologyInput}
            onChange={(event) => setTechnologyInput(event.target.value)}
            onKeyDown={handleTechnologyKeyDown}
            maxLength={50}
            placeholder="e.g. React"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-sans"
          />

          <button
            type="button"
            onClick={handleAddTechnology}
            disabled={!technologyInput.trim() || technologies.length >= 20}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] disabled:opacity-40 text-white px-4 py-2.5 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer shrink-0"
          >
            <FiPlus className="h-4 w-4 text-purple-400" />

            <span>Add</span>
          </button>
        </div>

        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {technologies.map((technology, technologyIndex) => (
              <span
                key={`${technology}-${technologyIndex}`}
                className="group inline-flex items-center space-x-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 px-3 py-1.5 text-xs font-semibold font-manrope text-slate-800 transition-colors"
              >
                <span>{technology}</span>

                <button
                  type="button"
                  onClick={() => handleRemoveTechnology(technologyIndex)}
                  aria-label={`Remove ${technology}`}
                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            {technologyErrorMessage && (
              <p className="text-xs font-medium text-rose-600">
                {technologyErrorMessage}
              </p>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            {technologies.length}/20
          </span>
        </div>
      </div>

      {/* Project URLs */}
      <div>
        <label
          htmlFor={`project-url-${index}`}
          className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
        >
          Project URLs
        </label>

        <p className="text-[11px] text-slate-400 mb-2">
          Repository, live demo, documentation, or other project links.
        </p>

        <div className="flex gap-2.5">
          <input
            id={`project-url-${index}`}
            type="url"
            value={urlInput}
            onChange={(event) => {
              setUrlInput(event.target.value);

              if (urlInputError) {
                setUrlInputError(null);
              }
            }}
            onKeyDown={handleUrlKeyDown}
            disabled={urls.length >= 5}
            placeholder="https://github.com/username/project"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 font-sans"
          />

          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim() || urls.length >= 5}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] disabled:opacity-40 text-white px-4 py-2.5 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-indigo-500/40 transition-all cursor-pointer shrink-0"
          >
            <FiPlus className="h-4 w-4 text-indigo-400" />

            <span>Add</span>
          </button>
        </div>

        {urls.length > 0 && (
          <div className="space-y-2 mt-3">
            {urls.map((url, urlIndex) => (
              <div
                key={`${url}-${urlIndex}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 truncate text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {url}
                </a>

                <button
                  type="button"
                  onClick={() => handleRemoveUrl(urlIndex)}
                  aria-label={`Remove ${url}`}
                  className="shrink-0 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            {(urlInputError || urlErrorMessage) && (
              <p className="text-xs font-medium text-rose-600">
                {urlInputError || urlErrorMessage}
              </p>
            )}
          </div>

          <span className="text-[11px] text-slate-400">{urls.length}/5</span>
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />

          {projectError?.startDate && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">
              {projectError.startDate.message}
            </p>
          )}
        </div>

        {/* End Date */}
        <div>
          {!isCurrent ? (
            <>
              <label
                htmlFor={`project-end-date-${index}`}
                className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
              >
                End Month *
              </label>

              <input
                id={`project-end-date-${index}`}
                type="month"
                {...register(`portfolioProjects.${index}.endDate` as const)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />

              {projectError?.endDate && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {projectError.endDate.message}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope">
                End Month
              </p>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700">
                Current project — no end date required.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Current Project */}
      <label className="inline-flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          {...register(`portfolioProjects.${index}.isCurrent` as const, {
            onChange: (event) => {
              if (event.target.checked) {
                /*
                 * When current=true,
                 * remove old endDate.
                 */
                setValue(`portfolioProjects.${index}.endDate`, "", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            },
          })}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />

        <span className="text-xs font-semibold text-slate-700">
          I am currently working on this project
        </span>
      </label>
    </div>
  );
}
