import type { HTMLAttributes, ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ProfileEditForm } from "./profile-edit-form";

const mockUpdateProfile = vi.fn();
const mockRefetchProfile = vi.fn();

const mockProfile = {
  id: "user-123",
  _id: "user-123",
  name: "Original User",
  email: "test@example.com",
  role: "user",
  headline: "Original Headline",
  bio: "Original bio",
  avatarUrl: null,
  skills: [],
  experiences: [],
  portfolioProjects: [],
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-123",
      name: "Original User",
      email: "test@example.com",
      role: "user",
    },
    isLoading: false,
  }),
}));

vi.mock("../queries/user-queries", () => ({
  useUserProfile: () => ({
    data: mockProfile,
    isLoading: false,
    error: null,
    refetch: mockRefetchProfile,
  }),
}));

vi.mock("../mutations/user-mutations", () => ({
  useUpdateProfileMutation: () => ({
    mutateAsync: mockUpdateProfile,
    isPending: false,
  }),

  useCreatePortfolioProjectMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),

  useUpdatePortfolioProjectMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),

  useDeletePortfolioProjectMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),

  useAddSkillMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),

  useRemoveSkillMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),

  useAddExperienceMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),

  useUpdateExperienceMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),

  useDeleteExperienceMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },

  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("./experience-modal", () => ({
  ExperienceModal: () => null,
}));

vi.mock("./delete-project-modal", () => ({
  DeleteProjectModal: () => null,
}));

vi.mock("./portfolio-project-fields", () => ({
  PortfolioProjectFields: () => null,
}));

vi.mock("./profile-skeleton", () => ({
  ProfileSkeleton: () => <div>Loading profile</div>,
}));

vi.mock("../utils/image-utils", () => ({
  compressImage: vi.fn(),
}));

describe("ProfileEditForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUpdateProfile.mockResolvedValue({
      success: true,
    });
  });

  it("updates the basic profile with normalized values", async () => {
    const user = userEvent.setup();

    render(<ProfileEditForm />);

    const nameInput = screen.getByPlaceholderText(/your full name/i);

    const headlineInput = screen.getByPlaceholderText(
      /senior full-stack engineer/i,
    );

    const bioInput = screen.getByPlaceholderText(
      /tell other developers about yourself/i,
    );

    await waitFor(() => {
      expect(nameInput).toHaveValue("Original User");
    });

    await user.clear(nameInput);
    await user.type(nameInput, "  Updated User  ");

    await user.clear(headlineInput);
    await user.type(headlineInput, "  Backend Developer  ");

    await user.clear(bioInput);
    await user.type(bioInput, "  Updated biography  ");

    const saveButton = screen.getByRole("button", {
      name: /save profile/i,
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateProfile).toHaveBeenCalledWith({
      name: "Updated User",
      headline: "Backend Developer",
      bio: "Updated biography",
      avatarUrl: null,
    });
  });
});
