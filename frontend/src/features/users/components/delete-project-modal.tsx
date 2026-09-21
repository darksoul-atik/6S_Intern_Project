'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiFolder, FiTrash2, FiX } from 'react-icons/fi';

export interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
}

export function DeleteProjectModal({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
}: DeleteProjectModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-modal-title"
            className="relative w-full max-w-md rounded-3xl border border-white/90 bg-white p-5 sm:p-7 backdrop-blur-2xl shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto"
          >
            {/* Header with Icon and Dismiss */}
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                <FiAlertTriangle className="h-6 w-6 text-rose-600" />
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content & Warning */}
            <div className="space-y-3">
              <h3
                id="delete-project-modal-title"
                className="text-base sm:text-lg font-bold font-manrope text-slate-900 tracking-tight"
              >
                Delete Portfolio Project?
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Are you sure you want to remove this project? All associated project URLs,
                technologies, and details will be removed from your profile.
              </p>

              {/* Project Preview Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
                <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0">
                  <FiFolder className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 font-manrope truncate">
                  {projectTitle || 'Untitled Project'}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 font-sans">
                This action will be saved when you submit your profile changes.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                id="cancel-delete-project-btn"
                className="px-4 py-2.5 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors text-center cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                id="confirm-delete-project-btn"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold font-manrope rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
                <span>Delete Project</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
