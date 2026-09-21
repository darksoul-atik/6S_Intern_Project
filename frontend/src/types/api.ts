export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  errors?: string[];
}

export class ApiError<T = unknown> extends Error {
  statusCode: number;
  errors: string[];
  data?: T;

  constructor(
    message: string,
    statusCode = 400,
    errors: string[] = [],
    data?: T,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = data;
  }
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  items?: T[];
  users?: T[];
  posts?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
