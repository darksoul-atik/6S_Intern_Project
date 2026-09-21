export interface AdminUser {
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

export interface PaginatedResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUsersFilterParams {
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
}

export interface UpdateAdminUserPayload {
  name: string;
  email: string;
  role: 'admin' | 'user';
  title?: string;
}
