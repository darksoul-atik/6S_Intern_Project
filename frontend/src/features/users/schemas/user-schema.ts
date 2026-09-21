import { z } from "zod";

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/*
|--------------------------------------------------------------------------
| Valid Web URL Helper
|--------------------------------------------------------------------------
*/

export function isValidWebUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname;

    if (!hostname || hostname.includes(" ")) {
      return false;
    }

    if (hostname === "localhost") {
      return true;
    }

    const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

    if (isIpv4) {
      return true;
    }

    return /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(
      hostname,
    );
  } catch {
    return false;
  }
}

/*
|--------------------------------------------------------------------------
| Project URLs
|--------------------------------------------------------------------------
*/

export const projectUrlsSchema = z
  .array(
    z
      .string()
      .trim()
      .refine(
        (value) => isValidWebUrl(value),
        "Each URL must be a valid HTTP or HTTPS URL (e.g. https://example.com)",
      ),
  )
  .max(5, "URLs cannot contain more than 5 links")
  .superRefine((urls, ctx) => {
    const seen = new Map<string, number>();

    urls.forEach((url, index) => {
      const normalized = url.toLowerCase();

      if (seen.has(normalized)) {
        ctx.addIssue({
          code: "custom",
          message: "URLs cannot contain duplicate links",
          path: [index],
        });
        return;
      }

      seen.set(normalized, index);
    });
  });

/*
|--------------------------------------------------------------------------
| Project technologies
|--------------------------------------------------------------------------
*/

export const projectTechnologiesSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Technology cannot be empty")
      .max(50, "Each technology must not exceed 50 characters"),
  )
  .min(1, "At least one technology is required")
  .max(20, "Technologies cannot contain more than 20 items")
  .superRefine((technologies, ctx) => {
    const seen = new Map<string, number>();

    technologies.forEach((technology, index) => {
      const normalized = technology.toLowerCase();

      if (seen.has(normalized)) {
        ctx.addIssue({
          code: "custom",
          message: "Technologies cannot contain duplicates",
          path: [index],
        });
        return;
      }

      seen.set(normalized, index);
    });
  });

/*
|--------------------------------------------------------------------------
| Portfolio project
|--------------------------------------------------------------------------
*/

export const portfolioProjectFormSchema = z
  .object({
    /*
     * Backend MongoDB project ID.
     * Existing project -> projectId exists
     * New unsaved project -> projectId is undefined
     */
    projectId: z.string().optional(),

    title: z
      .string()
      .trim()
      .min(1, "Title cannot be empty")
      .max(100, "Title must not exceed 100 characters"),

    description: z
      .string()
      .trim()
      .min(1, "Description cannot be empty")
      .max(1000, "Description must not exceed 1000 characters"),

    urls: projectUrlsSchema,

    technologies: projectTechnologiesSchema,

    startDate: z
      .string()
      .trim()
      .regex(YEAR_MONTH_PATTERN, "Start date must be in YYYY-MM format"),

    /*
     * The form uses "" when there is no end date.
     * Before sending to the backend, "" will be removed because
     * the backend requires endDate to be ABSENT when isCurrent=true.
     */
    endDate: z.string().trim().optional(),

    isCurrent: z.boolean(),
  })
  .superRefine((project, ctx) => {
    const endDate = project.endDate ?? "";

    /*
     * Current project:
     * endDate must not exist.
     */
    if (project.isCurrent) {
      if (endDate !== "") {
        ctx.addIssue({
          code: "custom",
          message: "End date must not be provided when project is current",
          path: ["endDate"],
        });
      }

      return;
    }

    /*
     * Finished project:
     * endDate is required.
     */
    if (endDate === "") {
      ctx.addIssue({
        code: "custom",
        message: "End date is required when project is not current",
        path: ["endDate"],
      });

      return;
    }

    /*
     * Validate YYYY-MM.
     */
    if (!YEAR_MONTH_PATTERN.test(endDate)) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be in YYYY-MM format",
        path: ["endDate"],
      });

      return;
    }

    /*
     * Only compare dates when startDate itself is valid.
     */
    if (
      YEAR_MONTH_PATTERN.test(project.startDate) &&
      endDate < project.startDate
    ) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be the same as or later than start date",
        path: ["endDate"],
      });
    }
  });

/*
|--------------------------------------------------------------------------
| Complete profile edit form
|--------------------------------------------------------------------------
*/

export const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name must not exceed 100 characters"),

  headline: z
    .string()
    .trim()
    .max(160, "Headline must not exceed 160 characters"),

  bio: z.string().trim().max(2000, "Bio must not exceed 2000 characters"),

  avatarUrl: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:image/"),
      "Avatar must be a valid HTTP/HTTPS URL or Base64 image",
    ),

  portfolioProjects: z.array(portfolioProjectFormSchema),
});

/*
|--------------------------------------------------------------------------
| Types generated from Zod
|--------------------------------------------------------------------------
*/

export type PortfolioProjectFormValues = z.infer<
  typeof portfolioProjectFormSchema
>;

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
