'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBriefcase, FiX, FiAlertCircle, FiCalendar, FiCheck } from 'react-icons/fi';
import type { Experience, ExperiencePayload } from './users.api';
import { formatDateDisplay, toDateInputValue } from '@/lib/formatters';

export interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExp: Experience | null;
  onSave: (payload: ExperiencePayload) => Promise<void>;
  isLoading: boolean;
}

export function ExperienceModal({
  isOpen,
  onClose,
  editingExp,
  onSave,
  isLoading,
}: ExperienceModalProps) {
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expFrom, setExpFrom] = useState('');
  const [expTo, setExpTo] = useState('');
  const [isExpPresent, setIsExpPresent] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [expError, setExpError] = useState<string | null>(null);

  const fromPickerRef = useRef<HTMLInputElement>(null);
  const toPickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingExp) {
        setExpTitle(editingExp.title);
        setExpCompany(editingExp.company);
        setExpFrom(toDateInputValue(editingExp.from));
        const isPresent = !editingExp.to || editingExp.to.toLowerCase() === 'present';
        setIsExpPresent(isPresent);
        setExpTo(isPresent ? '' : toDateInputValue(editingExp.to));
        setExpDescription(editingExp.description || '');
      } else {
        setExpTitle('');
        setExpCompany('');
        setExpFrom('');
        setExpTo('');
        setIsExpPresent(false);
        setExpDescription('');
      }
      setExpError(null);
    }
  }, [isOpen, editingExp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expCompany.trim() || !expFrom.trim()) {
      setExpError('Title, Company, and Start Date are required');
      return;
    }

    setExpError(null);
    try {
      await onSave({
        title: expTitle.trim(),
        company: expCompany.trim(),
        from: expFrom.trim(),
        to: isExpPresent ? 'Present' : expTo.trim() || undefined,
        description: expDescription.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setExpError(err.message);
      } else {
        setExpError('Failed to save work experience');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg rounded-3xl border border-white/80 bg-white p-4 sm:p-7 md:p-8 backdrop-blur-2xl shadow-2xl space-y-4 sm:space-y-5 text-left max-h-[90vh] overflow-y-auto"
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
                onClick={onClose}
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Start Date */}
                <div>
                  <label
                    htmlFor="exp-from-input"
                    className="block text-xs font-semibold text-slate-700 mb-1.5 font-manrope"
                  >
                    Start Date (Calendar) *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="exp-from-input"
                      ref={fromPickerRef}
                      type="date"
                      value={expFrom}
                      onChange={(e) => setExpFrom(e.target.value)}
                      onClick={() => fromPickerRef.current?.showPicker?.()}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-10 py-2.5 text-base sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans cursor-pointer"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => fromPickerRef.current?.showPicker?.()}
                      className="absolute right-3 p-1 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                      title="Open calendar picker"
                    >
                      <FiCalendar className="h-4 w-4" />
                    </button>
                  </div>
                  {expFrom ? (
                    <p className="text-[11px] text-indigo-600 font-medium mt-1">
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
                      htmlFor="exp-to-input"
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
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <span className="text-[11px] font-medium text-indigo-700">Present</span>
                    </label>
                  </div>

                  {!isExpPresent ? (
                    <div>
                      <div className="relative flex items-center">
                        <input
                          id="exp-to-input"
                          ref={toPickerRef}
                          type="date"
                          value={expTo}
                          onChange={(e) => setExpTo(e.target.value)}
                          onClick={() => toPickerRef.current?.showPicker?.()}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-3.5 pr-10 py-2.5 text-base sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans cursor-pointer"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => toPickerRef.current?.showPicker?.()}
                          className="absolute right-3 p-1 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                          title="Open calendar picker"
                        >
                          <FiCalendar className="h-4 w-4" />
                        </button>
                      </div>
                      {expTo ? (
                        <p className="text-[11px] text-indigo-600 font-medium mt-1">
                          Selected: {formatDateDisplay(expTo)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1">
                          Click to select date
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="w-full rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2.5 text-xs font-semibold text-indigo-700 font-sans flex items-center space-x-1.5 h-[42px]">
                      <FiCheck className="h-3.5 w-3.5 text-indigo-600" />
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold font-manrope text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-exp-btn"
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] disabled:opacity-50 text-white px-5 py-2 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-indigo-500/40 transition-all cursor-pointer"
                >
                  <FiCheck className="h-4 w-4 text-indigo-400" />
                  <span>{isLoading ? 'Saving...' : 'Save Experience'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
