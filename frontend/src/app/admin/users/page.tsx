'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers,
  FiSearch,
  FiMail,
  FiCalendar,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiTrash2,
  FiEdit3,
  FiRotateCcw,
  FiExternalLink,
  FiCopy,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiLock,
  FiUserCheck,
  FiUserX,
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/lib/api';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  title?: string;
  avatarUrl?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  skills?: string[];
}

interface PaginatedResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading, isAuthenticated } = useAuth();

  // State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(8);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Modals state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: 'admin' | 'user';
    title: string;
  }>({ name: '', email: '', role: 'user', title: '' });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Helper for user initials (max 2 words)
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Format date helper
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  // Fetch Users
  const fetchUsers = useCallback(
    async (page: number, search: string) => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          includeDeleted: 'true',
        });
        if (search.trim()) {
          queryParams.set('search', search.trim());
        }

        const res = await apiClient<PaginatedResponse>(`/api/users?${queryParams.toString()}`);
        if (res.success && res.data) {
          setUsers(res.data.users || []);
          setTotalUsers(res.data.total || 0);
          setCurrentPage(res.data.page || 1);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load users list';
        showNotification('error', message);
      } finally {
        setIsLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser?.role === 'admin') {
      fetchUsers(currentPage, searchQuery);
    }
  }, [authLoading, isAuthenticated, currentUser, currentPage, fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchUsers(newPage, searchQuery);
    }
  };

  // Copy email
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Open Edit Modal
  const openEditModal = (targetUser: AdminUser) => {
    setEditingUser(targetUser);
    setEditForm({
      name: targetUser.name || '',
      email: targetUser.email || '',
      role: targetUser.role || 'user',
      title: targetUser.title || '',
    });
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editForm.name.trim()) {
      showNotification('error', 'Display name cannot be empty');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const res = await apiClient<AdminUser>(`/api/users/${editingUser.id}/admin`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim().toLowerCase(),
          role: editForm.role,
          title: editForm.title.trim() || undefined,
        }),
      });

      if (res.success) {
        showNotification('success', `User details for "${editForm.name}" updated successfully`);
        setEditingUser(null);
        fetchUsers(currentPage, searchQuery);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update user details';
      showNotification('error', message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete User
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);

    try {
      const res = await apiClient<{ message: string }>(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      if (res.success) {
        showNotification(
          'success',
          `User "${deletingUser.name}" has been deleted. They will be blocked from logging in with a deletion notice.`
        );
        setDeletingUser(null);
        fetchUsers(currentPage, searchQuery);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete user';
      showNotification('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Restore User
  const handleRestoreUser = async (targetUser: AdminUser) => {
    try {
      const res = await apiClient<{ message: string }>(`/api/users/${targetUser.id}/restore`, {
        method: 'POST',
      });

      if (res.success) {
        showNotification('success', `Account for "${targetUser.name}" has been restored successfully`);
        fetchUsers(currentPage, searchQuery);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to restore user account';
      showNotification('error', message);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (activeFilter === 'active') return !u.isDeleted;
    if (activeFilter === 'deleted') return !!u.isDeleted;
    return true;
  });

  // Calculate stats
  const activeCount = users.filter((u) => !u.isDeleted).length;
  const deletedCount = users.filter((u) => u.isDeleted).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  // Render Access Denied if non-admin
  if (!authLoading && (!isAuthenticated || currentUser?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-lg space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
            <FiLock className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold font-manrope text-slate-900">Administrator Access Required</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              This management portal is strictly restricted to system administrators. Your account does not have authorization to view or manage registered users.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold font-manrope transition-all shadow-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-16">
      {/* Background Subtle Gradient Glow */}
      <div
        className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-6 sm:space-y-8">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-medium backdrop-blur-md border ${
                notification.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
                  : 'bg-rose-950/90 text-rose-200 border-rose-500/30'
              }`}
            >
              {notification.type === 'success' ? (
                <FiCheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <FiAlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span>{notification.message}</span>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="hover:opacity-70 text-slate-400"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-200/60 bg-indigo-50/80 px-3 py-0.5 text-[11px] font-semibold text-indigo-700 font-manrope">
              <FiShield className="h-3 w-3" />
              <span>Admin Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope tracking-tight text-slate-900">
              User Management & Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-2xl leading-relaxed">
              Full directory of registered developers. Inspect user identities, edit profile details, manage access permissions, or soft-delete accounts with customized login rejection notices.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => fetchUsers(currentPage, searchQuery)}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold font-manrope text-slate-700 hover:bg-slate-50 shadow-2xs transition-all disabled:opacity-50"
            >
              <FiRefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* KPI Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total */}
          <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium font-manrope">
              <span>Total Users</span>
              <div className="h-7 w-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FiUsers className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold font-manrope text-slate-900">
              {totalUsers}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Across whole platform</span>
          </div>

          {/* Card 2: Active */}
          <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium font-manrope">
              <span>Active Accounts</span>
              <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FiUserCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold font-manrope text-emerald-600">
              {activeCount}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Permitted to sign in</span>
          </div>

          {/* Card 3: Deleted / Blocked */}
          <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium font-manrope">
              <span>Deleted / Suspended</span>
              <div className="h-7 w-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <FiUserX className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold font-manrope text-rose-600">
              {deletedCount}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Blocked with notice</span>
          </div>

          {/* Card 4: Admins */}
          <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium font-manrope">
              <span>Admins</span>
              <div className="h-7 w-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FiShield className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold font-manrope text-purple-700">
              {adminCount}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Elevated privileges</span>
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/90 border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or title..."
              className="w-full pl-9 pr-20 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchUsers(1, '');
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold font-manrope transition-colors"
            >
              Search
            </button>
          </form>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5 border border-slate-200/80 bg-slate-100/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 text-xs font-semibold font-manrope rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalUsers})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1 text-xs font-semibold font-manrope rounded-lg transition-all ${
                activeFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('deleted')}
              className={`px-3 py-1 text-xs font-semibold font-manrope rounded-lg transition-all ${
                activeFilter === 'deleted'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deleted
            </button>
          </div>
        </div>

        {/* Users Table / Directory */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <div className="inline-block h-8 w-8 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium font-manrope">Loading registered developers...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FiUsers className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold font-manrope text-slate-800">No users found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No accounts matched your search term "${searchQuery}". Try searching with different keywords.`
                  : 'There are no users registered in this category.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold font-manrope uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 sm:px-6">User / Developer</th>
                    <th className="py-3.5 px-4">Contact Email</th>
                    <th className="py-3.5 px-4">Date Created</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors hover:bg-slate-50/70 ${
                          u.isDeleted ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* Avatar & Name */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center space-x-3">
                            <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-2xl p-[1px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 shrink-0 shadow-2xs">
                              <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#0c101c] overflow-hidden">
                                {u.avatarUrl ? (
                                  <img
                                    src={u.avatarUrl}
                                    alt={u.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold font-manrope text-white">
                                    {getInitials(u.name)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-0.5 max-w-[180px] sm:max-w-xs">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold font-manrope text-slate-900 truncate">
                                  {u.name}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-100 text-indigo-700 font-manrope">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate font-sans">
                                {u.title || 'Developer'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5 font-sans text-slate-600">
                            <FiMail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px] sm:max-w-none">{u.email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(u.email)}
                              title="Copy email address"
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                            >
                              {copiedEmail === u.email ? (
                                <FiCheck className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <FiCopy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center space-x-1.5 text-slate-500 font-sans text-xs">
                            <FiCalendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{formatDate(u.createdAt)}</span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-manrope bg-purple-50 text-purple-700 border border-purple-200/80">
                              <FiShield className="h-3 w-3 text-purple-600" />
                              <span>Admin</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-manrope bg-slate-100 text-slate-700 border border-slate-200/90">
                              <FiCheckCircle className="h-3 w-3 text-indigo-600" />
                              <span>Verified User</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {u.isDeleted ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-manrope bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                <span>Deleted by Admin</span>
                              </span>
                              {u.deletedAt && (
                                <p className="text-[10px] text-slate-400 font-sans">
                                  {formatDate(u.deletedAt)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-manrope bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="inline-flex items-center justify-end space-x-1.5">
                            {/* View Profile */}
                            <Link
                              href={`/profile/${u.id}`}
                              target="_blank"
                              title="View Developer Profile"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <FiExternalLink className="h-4 w-4" />
                            </Link>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              title="Edit user details"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-700 hover:text-indigo-700 bg-slate-100/80 hover:bg-indigo-50 border border-slate-200/80 rounded-lg font-manrope text-xs font-semibold transition-colors"
                            >
                              <FiEdit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* Delete or Restore */}
                            {u.isDeleted ? (
                              <button
                                type="button"
                                onClick={() => handleRestoreUser(u)}
                                title="Restore user account"
                                className="inline-flex items-center space-x-1 px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-manrope text-xs font-semibold transition-colors"
                              >
                                <FiRotateCcw className="h-3.5 w-3.5" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => setDeletingUser(u)}
                                title={isSelf ? 'Cannot delete own admin account' : 'Delete user account'}
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/80 rounded-lg font-manrope text-xs font-semibold transition-colors ${
                                  isSelf ? 'opacity-40 cursor-not-allowed' : ''
                                }`}
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* shadcn Pagination Integration */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40">
              <p className="text-xs text-slate-500 font-sans">
                Showing page <strong className="text-slate-800 font-semibold">{currentPage}</strong> of{' '}
                <strong className="text-slate-800 font-semibold">{totalPages}</strong> ({totalUsers} total users)
              </p>

              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  {/* Previous Button */}
                  <PaginationItem>
                    <PaginationPrevious
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    />
                  </PaginationItem>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Always show first, last, and pages adjacent to current page
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsisBefore = prevPage && page - prevPage > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      );
                    })}

                  {/* Next Button */}
                  <PaginationItem>
                    <PaginationNext
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold font-manrope text-slate-900">
                    Edit User: {editingUser.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Modify display name, email, system role, or professional headline.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-manrope text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
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
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                {/* Professional Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-manrope text-slate-700">
                    Professional Title / Headline
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    placeholder="e.g. Senior Full-Stack Engineer"
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                {/* Role Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-manrope text-slate-700">
                    System Role & Permissions
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value as 'admin' | 'user' })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 bg-white"
                  >
                    <option value="user">Verified User (Standard Developer)</option>
                    <option value="admin">Administrator (Full System Access)</option>
                  </select>
                </div>

                {/* Deep Link to full Profile Experiences/Skills Editor */}
                <div className="pt-2">
                  <Link
                    href={`/profile/${editingUser.id}/edit`}
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
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-manrope rounded-xl shadow-sm transition-all disabled:opacity-50"
                  >
                    {isSubmittingEdit ? 'Saving Changes...' : 'Save User Details'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                <FiAlertTriangle className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold font-manrope text-slate-900">
                  Delete Account for {deletingUser.name}?
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

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold font-manrope rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting User...' : 'Yes, Delete Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
