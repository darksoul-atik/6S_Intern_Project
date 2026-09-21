import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
