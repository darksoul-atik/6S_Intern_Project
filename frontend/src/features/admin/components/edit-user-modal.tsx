'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiExternalLink } from 'react-icons/fi';
import type { AdminUser, UpdateAdminUserPayload } from "../types/admin";

interface EditUserModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdateAdminUserPayload) => Promise<void>;
  isSubmitting: boolean;
  onError: (msg: string) => void;
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
  isSubmitting,
  onError,
}: EditUserModalProps) {
  const [formData, setFormData] = useState<UpdateAdminUserPayload>({
    name: '',
    email: '',
    role: 'user',
    title: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        title: user.title || '',
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onError('Display name cannot be empty');
      return;
    }

    await onSave(user.id, {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      title: formData.title?.trim() || undefined,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-4 sm:p-7 md:p-8 shadow-2xl space-y-5 sm:space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold font-manrope text-slate-900 break-words">
                Edit User: {user.name}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Modify display name, email, system role, or professional headline.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold font-manrope text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold font-manrope text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              />
            </div>

            {/* Professional Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold font-manrope text-slate-700">
                Professional Title / Headline
              </label>
              <input
                type="text"
                value={formData.title || ''}
                placeholder="e.g. Senior Full-Stack Engineer"
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold font-manrope text-slate-700">
                System Role & Permissions
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })
                }
                className="w-full px-3.5 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 bg-white"
              >
                <option value="user">Verified User (Standard Developer)</option>
                <option value="admin">Administrator (Full System Access)</option>
              </select>
            </div>

            {/* Deep Link to full Profile Experiences/Skills Editor */}
            <div className="pt-2">
              <Link
                href={`/profile/${user.id}/edit`}
                target="_blank"
                className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold font-manrope"
              >
                <span>Edit Skills, Work Experience & Avatar in Full Editor</span>
                <FiExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-manrope rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Changes...' : 'Save User Details'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
