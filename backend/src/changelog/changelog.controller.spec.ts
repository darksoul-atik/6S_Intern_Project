import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangelogController } from './changelog.controller.js';
import type { ChangelogService } from './changelog.service.js';

describe('ChangelogController', () => {
  let controller: ChangelogController;
  let mockService: Partial<ChangelogService>;

  beforeEach(() => {
    mockService = {
      getEntries: vi.fn().mockResolvedValue({
        entries: [],
        lastSyncedAt: null,
        source: 'mock',
      }),
      syncLatestPullRequest: vi.fn().mockResolvedValue({
        entry: null,
        message: 'No PR found',
      }),
    };

    controller = new ChangelogController(mockService as ChangelogService);
  });

  it('delegates getChangelog to ChangelogService.getEntries', async () => {
    const result = await controller.getChangelog(10);
    expect(mockService.getEntries).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      entries: [],
      lastSyncedAt: null,
      source: 'mock',
    });
  });

  it('delegates syncChangelog to ChangelogService.syncLatestPullRequest', async () => {
    const dto = { owner: 'darksoul-atik', repo: '6S_Intern_Project' };
    const result = await controller.syncChangelog(dto);
    expect(mockService.syncLatestPullRequest).toHaveBeenCalledWith(dto);
    expect(result).toEqual({
      entry: null,
      message: 'No PR found',
    });
  });
});
