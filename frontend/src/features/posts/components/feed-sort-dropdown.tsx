"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiCheck,
  FiChevronDown,
  FiClock,
  FiMessageSquare,
  FiTrendingUp,
} from "react-icons/fi";
import { useFeedSort, type FeedSort } from "../hooks/use-feed-sort";

interface SortOption {
  value: FeedSort;
  label: string;
  description: string;
  icon: typeof FiTrendingUp;
}

const sortOptions: SortOption[] = [
  {
    value: "top",
    label: "Top Ranked",
    description: "Highest community engagement",
    icon: FiTrendingUp,
  },
  {
    value: "latest",
    label: "Latest",
    description: "Chronological, newest first",
    icon: FiClock,
  },
  {
    value: "most-discussed",
    label: "Most Discussed",
    description: "Most active comment threads",
    icon: FiMessageSquare,
  },
];

export function FeedSortDropdown() {
  const { sort, setSort } = useFeedSort();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption =
    sortOptions.find((opt) => opt.value === sort) || sortOptions[0];
  const ActiveIcon = activeOption.icon;

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (value: FeedSort) => {
    setSort(value);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Feed sort options"
        className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold font-manrope text-slate-700 shadow-xs backdrop-blur-md transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900 active:scale-[0.98] cursor-pointer"
      >
        <ActiveIcon className="h-3.5 w-3.5 text-indigo-500 transition-colors group-hover:text-indigo-600" />
        <span className="font-sans text-[11px] text-slate-400 font-medium">Sort:</span>
        <span className="font-manrope text-xs font-semibold text-slate-800">{activeOption.label}</span>
        <FiChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Sort by"
          className="absolute right-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.08),0_6px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 font-manrope border-b border-slate-100 mb-1">
            Sort Discussions
          </div>

          <div className="space-y-0.5">
            {sortOptions.map((option) => {
              const isSelected = option.value === sort;
              const Icon = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/90 text-indigo-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-semibold font-manrope leading-tight">
                        {option.label}
                      </p>
                      <p className="truncate text-[10px] text-slate-500 font-sans mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <FiCheck className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
