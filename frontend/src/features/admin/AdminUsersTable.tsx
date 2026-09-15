'use client';

import React, { useState, useEffect } from 'react';
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
import { ApiError } from '@/lib/api';
import { getInitials, formatDate } from '@/lib/formatters';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  useAdminUsers,
  useUpdateAdminUserMutation,
  useSoftDeleteUserMutation,
  useRestoreUserMutation,
  type AdminUser,
  type UpdateAdminUserPayload,
} from './admin.api';
import { EditUserModal } from './EditUserModal';
import { DeleteUserConfirm } from './DeleteUserConfirm';

export function AdminUsersTable() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading, isAuthenticated } = useAuth();

  // State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(8);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // TanStack Query Users Fetch
  const {
    data: paginatedData,
    isLoading: isUsersLoading,
    isFetching,
    error: usersError,
    refetch,
  } = useAdminUsers(
    {
      page: currentPage,
      limit,
      search: activeSearch,
      includeDeleted: true,
    },
    {
      enabled: !authLoading && isAuthenticated && currentUser?.role === 'admin',
    },
  );

  const users = paginatedData?.users || [];
  const totalUsers = paginatedData?.total || 0;
  const totalPages = paginatedData?.totalPages || 1;
  const isLoading = isUsersLoading;

  // TanStack Query Admin Mutations
  const updateAdminUserMutation = useUpdateAdminUserMutation();
  const softDeleteUserMutation = useSoftDeleteUserMutation();
  const restoreUserMutation = useRestoreUserMutation();

  const isSubmittingEdit = updateAdminUserMutation.isPending;
  const isDeleting = softDeleteUserMutation.isPending;

  // Modals state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

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

  useEffect(() => {
    document.title = 'User List — DevPulse';
  }, []);

  useEffect(() => {
    if (usersError) {
      const message =
        usersError instanceof ApiError
          ? usersError.message
          : 'Failed to load users list';
      showNotification('error', message);
    }
  }, [usersError]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearch(searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  // Copy email
  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Submit Edit
  const handleSaveEdit = async (id: string, data: UpdateAdminUserPayload) => {
    try {
      await updateAdminUserMutation.mutateAsync({ id, data });
      showNotification(
        'success',
        `User details for "${data.name}" updated successfully`,
      );
      setEditingUser(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to update user details';
      showNotification('error', message);
    }
  };

  // Delete User
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      await softDeleteUserMutation.mutateAsync(deletingUser.id);
      showNotification(
        'success',
        `User "${deletingUser.name}" has been deleted. They will be blocked from logging in with a deletion notice.`,
      );
      setDeletingUser(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to delete user';
      showNotification('error', message);
    }
  };

  // Restore User
  const handleRestoreUser = async (targetUser: AdminUser) => {
    try {
      await restoreUserMutation.mutateAsync(targetUser.id);
      showNotification(
        'success',
        `Account for "${targetUser.name}" has been restored successfully`,
      );
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to restore user account';
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6 sm:space-y-8">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${
                notification.type === 'success'
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50/90 border-rose-200 text-rose-800'
              }`}
            >
              {notification.type === 'success' ? (
                <FiCheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <FiAlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              )}
              <span className="text-xs font-semibold font-manrope">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-xs font-semibold font-manrope mb-1">
              <FiShield className="h-3.5 w-3.5" />
              <span>Admin Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-manrope text-slate-900 tracking-tight">
              User Management Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-2xl">
              Inspect, modify profiles, administer system roles, or soft-delete user accounts across DevPulse.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold font-manrope text-slate-700 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
            >
              <FiRefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Metric Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-3.5">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <FiUsers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium font-sans">Total Accounts</p>
              <p className="text-lg sm:text-xl font-bold font-manrope text-slate-900">{totalUsers}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <FiUserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium font-sans">Active on Page</p>
              <p className="text-lg sm:text-xl font-bold font-manrope text-slate-900">{activeCount}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-3.5">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <FiShield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium font-sans">Admins on Page</p>
              <p className="text-lg sm:text-xl font-bold font-manrope text-slate-900">{adminCount}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center space-x-3.5">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
              <FiUserX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium font-sans">Deleted on Page</p>
              <p className="text-lg sm:text-xl font-bold font-manrope text-slate-900">{deletedCount}</p>
            </div>
          </div>
        </div>

        {/* Search & Status Filter Controls */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveSearch('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-manrope transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Users
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-manrope transition-all ${
                activeFilter === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('deleted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-manrope transition-all ${
                activeFilter === 'deleted'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Soft-Deleted
            </button>
          </div>
        </div>

        {/* User Directory Table / Card Container */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          {isLoading ? (
            /* Loading State */
            <div className="p-12 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent" />
              <p className="text-xs text-slate-500 font-sans">Loading registered user profiles...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FiUsers className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold font-manrope text-slate-800">No users found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
                {activeSearch
                  ? `No user records match the query "${activeSearch}". Try refining your search.`
                  : 'No user accounts match the selected status filter.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-[11px] font-semibold uppercase tracking-wider font-manrope">
                      <th className="py-3.5 px-5">User</th>
                      <th className="py-3.5 px-5">Role</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Skills</th>
                      <th className="py-3.5 px-5">Registered</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-sans">
                    {filteredUsers.map((targetUser) => {
                      const isSelf = targetUser.id === currentUser?.id;

                      return (
                        <tr
                          key={targetUser.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            targetUser.isDeleted ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          {/* User Column */}
                          <td className="py-4 px-5">
                            <div className="flex items-center space-x-3.5">
                              {targetUser.avatarUrl ? (
                                <img
                                  src={targetUser.avatarUrl}
                                  alt={targetUser.name}
                                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs font-manrope">
                                  {getInitials(targetUser.name)}
                                </div>
                              )}
                              <div className="space-y-0.5 max-w-[200px]">
                                <div className="flex items-center space-x-1.5">
                                  <Link
                                    href={`/developers/${targetUser.id}`}
                                    className="font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate font-manrope flex items-center space-x-1"
                                    title="View public profile"
                                  >
                                    <span>{targetUser.name}</span>
                                    <FiExternalLink className="h-3 w-3 opacity-60 shrink-0" />
                                  </Link>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold font-manrope">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1 text-slate-500 text-[11px] truncate">
                                  <FiMail className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{targetUser.email}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyEmail(targetUser.email)}
                                    title="Copy email"
                                    className="text-slate-400 hover:text-slate-600 transition-colors ml-0.5"
                                  >
                                    {copiedEmail === targetUser.email ? (
                                      <FiCheck className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <FiCopy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                                {targetUser.title && (
                                  <p className="text-[11px] text-slate-400 truncate">{targetUser.title}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role Column */}
                          <td className="py-4 px-5">
                            {targetUser.role === 'admin' ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-semibold font-manrope">
                                <FiShield className="h-3 w-3" />
                                <span>Administrator</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold font-manrope">
                                <span>Developer</span>
                              </span>
                            )}
                          </td>

                          {/* Status Column */}
                          <td className="py-4 px-5">
                            {targetUser.isDeleted ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold font-manrope">
                                  <FiAlertTriangle className="h-3 w-3" />
                                  <span>Soft-Deleted</span>
                                </span>
                                {targetUser.deletedAt && (
                                  <p className="text-[10px] text-slate-400">
                                    {formatDate(targetUser.deletedAt)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold font-manrope">
                                <FiCheckCircle className="h-3 w-3" />
                                <span>Active</span>
                              </span>
                            )}
                          </td>

                          {/* Skills Column */}
                          <td className="py-4 px-5 max-w-[200px]">
                            {targetUser.skills && targetUser.skills.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {targetUser.skills.slice(0, 3).map((sk) => (
                                  <span
                                    key={sk}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium"
                                  >
                                    {sk}
                                  </span>
                                ))}
                                {targetUser.skills.length > 3 && (
                                  <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[10px]">
                                    +{targetUser.skills.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">None declared</span>
                            )}
                          </td>

                          {/* Registered Column */}
                          <td className="py-4 px-5 text-slate-500 text-[11px]">
                            <div className="flex items-center space-x-1.5">
                              <FiCalendar className="h-3 w-3 text-slate-400" />
                              <span>{formatDate(targetUser.createdAt)}</span>
                            </div>
                          </td>

                          {/* Actions Column */}
                          <td className="py-4 px-5 text-right">
                            <div className="inline-flex items-center space-x-2">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => setEditingUser(targetUser)}
                                title="Edit user details"
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <FiEdit3 className="h-4 w-4" />
                              </button>

                              {/* Delete or Restore Action */}
                              {targetUser.isDeleted ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreUser(targetUser)}
                                  title="Restore soft-deleted user"
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-manrope text-[11px] font-semibold transition-colors"
                                >
                                  <FiRotateCcw className="h-3 w-3" />
                                  <span>Restore</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeletingUser(targetUser)}
                                  disabled={isSelf}
                                  title={
                                    isSelf
                                      ? 'You cannot delete your own administrator account'
                                      : 'Soft delete user account'
                                  }
                                  className={`p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ${
                                    isSelf ? 'opacity-30 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <FiTrash2 className="h-4 w-4" />
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

              {/* Mobile Card List View */}
              <div className="block lg:hidden divide-y divide-slate-100">
                {filteredUsers.map((targetUser) => {
                  const isSelf = targetUser.id === currentUser?.id;

                  return (
                    <div
                      key={targetUser.id}
                      className={`p-4 space-y-3.5 ${
                        targetUser.isDeleted ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          {targetUser.avatarUrl ? (
                            <img
                              src={targetUser.avatarUrl}
                              alt={targetUser.name}
                              className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs font-manrope">
                              {getInitials(targetUser.name)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <Link
                                href={`/developers/${targetUser.id}`}
                                className="font-bold text-slate-900 font-manrope hover:text-indigo-600 text-sm"
                              >
                                {targetUser.name}
                              </Link>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold font-manrope">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 text-slate-500 text-xs">
                              <FiMail className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[180px]">{targetUser.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(targetUser.email)}
                                className="text-slate-400 hover:text-slate-600 ml-1"
                              >
                                {copiedEmail === targetUser.email ? (
                                  <FiCheck className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <FiCopy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            {targetUser.title && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{targetUser.title}</p>
                            )}
                          </div>
                        </div>

                        {/* Status badge */}
                        {targetUser.isDeleted ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-semibold font-manrope shrink-0">
                            Deleted
                          </span>
                        ) : targetUser.role === 'admin' ? (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-semibold font-manrope shrink-0">
                            Admin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-semibold font-manrope shrink-0">
                            Active
                          </span>
                        )}
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-50">
                        <button
                          type="button"
                          onClick={() => setEditingUser(targetUser)}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-manrope text-xs font-semibold shrink-0"
                        >
                          <FiEdit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>

                        {targetUser.isDeleted ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreUser(targetUser)}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-manrope text-xs font-semibold shrink-0"
                          >
                            <FiRotateCcw className="h-3.5 w-3.5" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingUser(targetUser)}
                            disabled={isSelf}
                            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-manrope text-xs font-semibold shrink-0 ${
                              isSelf ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* shadcn Pagination Integration */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-slate-50/40">
              <p className="text-xs text-slate-500 font-sans text-center sm:text-left">
                Showing page <strong className="text-slate-800 font-semibold">{currentPage}</strong> of{' '}
                <strong className="text-slate-800 font-semibold">{totalPages}</strong> ({totalUsers} total users)
              </p>

              <div className="overflow-x-auto max-w-full py-1">
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
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveEdit}
        isSubmitting={isSubmittingEdit}
        onError={(msg) => showNotification('error', msg)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteUserConfirm
        user={deletingUser}
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
