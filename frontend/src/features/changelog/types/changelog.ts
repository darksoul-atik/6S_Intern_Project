export type ChangelogSource = 'github-app' | 'mock';

export interface ChangelogEntry {
  id?: string;
  _id?: string;
  owner: string;
  repo: string;
  prNumber: number;
  title: string;
  authorLogin: string;
  mergedAt: string;
  htmlUrl: string;
  baseBranch: string;
  source: ChangelogSource;
  syncedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChangelogData {
  entries: ChangelogEntry[];
  lastSyncedAt: string | null;
  source: ChangelogSource;
}

export interface ChangelogSyncPayload {
  owner?: string;
  repo?: string;
}

export interface ChangelogSyncResponse {
  entry: ChangelogEntry | null;
  message: string;
}
