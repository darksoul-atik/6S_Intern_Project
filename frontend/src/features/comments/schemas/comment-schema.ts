import { z } from "zod";

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty.")
    .max(5000, "Comment cannot exceed 5000 characters."),
});

export type CommentFormValues = z.infer<typeof commentSchema>;
