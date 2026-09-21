export interface Experience {
  _id: string;
  id?: string;
  title: string;
  company: string;
  from: string;
  to?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioProject {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  urls: string[];
  technologies: string[];
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  _id?: string;
  name: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  skills: string[];
  experiences: Experience[];
  portfolioProjects: PortfolioProject[];
  email?: string;
  role?: 'user' | 'admin';
  title?: string;
  reactionsCount?: number;
  commentsCount?: number;
  postsCount?: number;
  topRankedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  title?: string;
}

export interface ExperiencePayload {
  title: string;
  company: string;
  from: string;
  to?: string;
  description?: string;
}

export interface CreatePortfolioProjectPayload {
  title: string;
  description: string;
  urls?: string[];
  technologies: string[];
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

export interface UpdatePortfolioProjectPayload {
  title?: string;
  description?: string;
  urls?: string[];
  technologies?: string[];
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}
