import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Post Form Validation
|--------------------------------------------------------------------------
|
| Matches the current backend DTO rules:
|
| title:
| - required
| - trimmed
| - 1 to 200 characters
|
| body:
| - required
| - trimmed
| - 1 to 20,000 characters
|--------------------------------------------------------------------------
*/

export const postFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must not exceed 200 characters"),

  body: z
    .string()
    .trim()
    .min(1, "Post body is required")
    .max(20_000, "Post body must not exceed 20,000 characters"),
});

export type PostFormValues = z.infer<typeof postFormSchema>;
