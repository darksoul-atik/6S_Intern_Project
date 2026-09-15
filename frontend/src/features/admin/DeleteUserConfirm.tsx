'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import type { AdminUser } from './admin.api';

interface DeleteUserConfirmProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteUserConfirm({
  user,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteUserConfirmProps) {
  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-4 sm:p-7 md:p-8 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
            <FiAlertTriangle className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold font-manrope text-slate-900 break-words">
              Delete Account for {user.name}?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              This user will be marked as <strong>deleted</strong>. When they subsequently attempt to log in with their email and password, their login will be rejected with the notice:
            </p>
            <div className="p-3 bg-rose-50/80 border border-rose-200/80 rounded-xl text-xs font-mono text-rose-800 italic">
              &quot;Your profile has been deleted by an Admin. Please contact support if you believe this was an error.&quot;
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              You can restore this account at any time from this dashboard.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold font-manrope rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {isDeleting ? 'Deleting User...' : 'Yes, Delete Account'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
