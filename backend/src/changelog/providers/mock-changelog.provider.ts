import { Injectable } from '@nestjs/common';
import type {
  ChangelogProvider,
  MergedPullRequest,
} from './changelog-provider.interface.js';

@Injectable()
export class MockChangelogProvider implements ChangelogProvider {
  readonly source = 'mock' as const;

  async getLatestMergedPullRequest(
    owner: string,
    repo: string,
    _options?: { signal?: AbortSignal },
  ): Promise<MergedPullRequest | null> {
    const cleanOwner = owner.toLowerCase().trim();
    const cleanRepo = repo.toLowerCase().trim();

    return {
      prNumber: 42,
      title: 'fix login cookie flags',
      authorLogin: 'alice',
      mergedAt: new Date('2026-01-15T10:30:00.000Z'),
      htmlUrl: `https://github.com/${cleanOwner}/${cleanRepo}/pull/42`,
      baseBranch: 'main',
    };
  }
}
