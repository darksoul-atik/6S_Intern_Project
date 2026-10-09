import type { ChangelogSource } from '../schemas/changelog-entry.schema.js';

export interface MergedPullRequest {
  prNumber: number;
  title: string;
  authorLogin: string;
  mergedAt: Date;
  htmlUrl: string;
  baseBranch: string;
}

export interface ChangelogProvider {
  readonly source: ChangelogSource;
  getLatestMergedPullRequest(
    owner: string,
    repo: string,
    options?: { signal?: AbortSignal },
  ): Promise<MergedPullRequest | null>;
}

export const CHANGELOG_PROVIDER_TOKEN = Symbol('CHANGELOG_PROVIDER');
