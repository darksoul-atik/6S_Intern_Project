import { describe, expect, it } from "vitest";

import {
  isValidWebUrl,
  portfolioProjectFormSchema,
  profileFormSchema,
  projectTechnologiesSchema,
  projectUrlsSchema,
} from "./user-schema";

const validProject = {
  title: "DevPulse",
  description: "Developer community platform",
  urls: ["https://github.com/example/devpulse"],
  technologies: ["Next.js", "NestJS", "MongoDB"],
  startDate: "2026-01",
  endDate: "",
  isCurrent: true,
};

const validProfile = {
  name: "Test User",
  headline: "Full Stack Developer",
  bio: "I build web applications.",
  avatarUrl: "https://example.com/avatar.png",
  portfolioProjects: [validProject],
};

describe("isValidWebUrl", () => {
  it("accepts valid HTTP and HTTPS URLs", () => {
    expect(isValidWebUrl("https://example.com")).toBe(true);

    expect(isValidWebUrl("http://example.com")).toBe(true);
  });

  it("rejects unsupported or invalid URLs", () => {
    expect(isValidWebUrl("ftp://example.com")).toBe(false);

    expect(isValidWebUrl("not-a-url")).toBe(false);
  });
});

describe("projectUrlsSchema", () => {
  it("accepts valid project URLs", () => {
    const result = projectUrlsSchema.safeParse([
      "https://github.com/example/project",
      "https://example.com",
    ]);

    expect(result.success).toBe(true);
  });

  it("rejects invalid project URLs", () => {
    const result = projectUrlsSchema.safeParse(["not-a-valid-url"]);

    expect(result.success).toBe(false);
  });

  it("rejects duplicate URLs case-insensitively", () => {
    const result = projectUrlsSchema.safeParse([
      "https://example.com",
      "https://EXAMPLE.com",
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects more than 5 URLs", () => {
    const result = projectUrlsSchema.safeParse([
      "https://one.com",
      "https://two.com",
      "https://three.com",
      "https://four.com",
      "https://five.com",
      "https://six.com",
    ]);

    expect(result.success).toBe(false);
  });
});

describe("projectTechnologiesSchema", () => {
  it("accepts valid technologies", () => {
    const result = projectTechnologiesSchema.safeParse([
      "Next.js",
      "NestJS",
      "MongoDB",
    ]);

    expect(result.success).toBe(true);
  });

  it("requires at least one technology", () => {
    const result = projectTechnologiesSchema.safeParse([]);

    expect(result.success).toBe(false);
  });

  it("rejects duplicate technologies case-insensitively", () => {
    const result = projectTechnologiesSchema.safeParse(["React", "react"]);

    expect(result.success).toBe(false);
  });

  it("rejects more than 20 technologies", () => {
    const technologies = Array.from(
      { length: 21 },
      (_, index) => `Technology-${index}`,
    );

    const result = projectTechnologiesSchema.safeParse(technologies);

    expect(result.success).toBe(false);
  });
});

describe("portfolioProjectFormSchema", () => {
  it("accepts a valid current project without an end date", () => {
    const result = portfolioProjectFormSchema.safeParse(validProject);

    expect(result.success).toBe(true);
  });

  it("accepts a valid completed project with an end date", () => {
    const result = portfolioProjectFormSchema.safeParse({
      ...validProject,
      isCurrent: false,
      endDate: "2026-09",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty project title", () => {
    const result = portfolioProjectFormSchema.safeParse({
      ...validProject,
      title: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty project description", () => {
    const result = portfolioProjectFormSchema.safeParse({
      ...validProject,
      description: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid start date format", () => {
    const result = portfolioProjectFormSchema.safeParse({
      ...validProject,
      startDate: "January 2026",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an end date for a current project", () => {
    const result = portfolioProjectFormSchema.safeParse({
      ...validProject,
      isCurrent: true,
      endDate: "2026-09",
    });

    expect(result.success).toBe(false);
  });

  it("requires an end date for a completed project", () => {
    const result = portfolioProjectFormSchema.safeParse({
      ...validProject,
      isCurrent: false,
      endDate: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid completed-project end date format", () => {
    const result = portfolioProjectFormSchema.safeParse({
      ...validProject,
      isCurrent: false,
      endDate: "September 2026",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an end date earlier than the start date", () => {
    const result = portfolioProjectFormSchema.safeParse({
      ...validProject,
      startDate: "2026-06",
      endDate: "2026-05",
      isCurrent: false,
    });

    expect(result.success).toBe(false);
  });
});

describe("profileFormSchema", () => {
  it("accepts a valid complete profile", () => {
    const result = profileFormSchema.safeParse(validProfile);

    expect(result.success).toBe(true);
  });

  it("accepts optional empty profile fields", () => {
    const result = profileFormSchema.safeParse({
      name: "Test User",
      headline: "",
      bio: "",
      avatarUrl: "",
      portfolioProjects: [],
    });

    expect(result.success).toBe(true);
  });

  it("trims profile text fields", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      name: "  Test User  ",
      headline: "  Developer  ",
      bio: "  My biography  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Test User");
      expect(result.data.headline).toBe("Developer");
      expect(result.data.bio).toBe("My biography");
    }
  });

  it("rejects an empty name", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      name: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a headline longer than 160 characters", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      headline: "a".repeat(161),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a bio longer than 2000 characters", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      bio: "a".repeat(2001),
    });

    expect(result.success).toBe(false);
  });

  it("accepts HTTP, HTTPS, and Base64 avatar values", () => {
    expect(
      profileFormSchema.safeParse({
        ...validProfile,
        avatarUrl: "http://example.com/avatar.png",
      }).success,
    ).toBe(true);

    expect(
      profileFormSchema.safeParse({
        ...validProfile,
        avatarUrl: "https://example.com/avatar.png",
      }).success,
    ).toBe(true);

    expect(
      profileFormSchema.safeParse({
        ...validProfile,
        avatarUrl: "data:image/png;base64,test-data",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid avatar value", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      avatarUrl: "invalid-avatar",
    });

    expect(result.success).toBe(false);
  });

  it("rejects the entire profile when a portfolio project is invalid", () => {
    const result = profileFormSchema.safeParse({
      ...validProfile,
      portfolioProjects: [
        {
          ...validProject,
          technologies: [],
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
