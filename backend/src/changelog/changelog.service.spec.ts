import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ChangelogService } from './changelog.service.js';
import { MockChangelogProvider } from './providers/mock-changelog.provider.js';
import type { ChangelogProvider } from './providers/changelog-provider.interface.js';
import {
  InvalidRepositoryException,
  UpstreamRateLimitedException,
  UpstreamTimeoutException,
} from './errors/changelog.errors.js';

describe('ChangelogService', () => {
  let service: ChangelogService;
  let mockModel: any;
  let mockProvider: ChangelogProvider;
  let mockConfigService: Partial<ConfigService>;
  let inMemoryDb: Map<string, any>;

  beforeEach(() => {
    inMemoryDb = new Map();

    mockModel = {
      findOneAndUpdate: vi.fn(
        (query: any, update: any, _options: any) => ({
          lean: () => ({
            exec: vi.fn().mockImplementation(async () => {
              const key = `${query.source}:${query.owner}:${query.repo}:${query.prNumber}`;
              const existing = inMemoryDb.get(key) || {};
              const merged = {
                ...existing,
                ...query,
                ...update.$set,
                ...update.$setOnInsert,
                syncedAt: update.$set?.syncedAt || new Date(),
              };
              inMemoryDb.set(key, merged);
              return merged;
            }),
          }),
        }),
      ),
      findOne: vi.fn((query: any) => ({
        lean: () => ({
          exec: vi.fn().mockImplementation(async () => {
            const key = `${query.source}:${query.owner}:${query.repo}:${query.prNumber}`;
            return inMemoryDb.get(key) || null;
          }),
        }),
      })),
      find: vi.fn((filter: any) => ({
        sort: (_sortObj: any) => ({
          limit: (limitNum: number) => ({
            lean: () => ({
              exec: vi.fn().mockImplementation(async () => {
                const results: any[] = [];
                for (const item of inMemoryDb.values()) {
                  if (!filter.source || item.source === filter.source) {
                    results.push(item);
                  }
                }
                results.sort(
                  (a, b) =>
                    new Date(b.mergedAt).getTime() -
                    new Date(a.mergedAt).getTime(),
                );
                return results.slice(0, limitNum);
              }),
            }),
          }),
        }),
      })),
    };

    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'CHANGELOG_REPO') {
          return 'darksoul-atik/6S_Intern_Project';
        }
        return undefined;
      }),
    };

    mockProvider = new MockChangelogProvider();

    service = new ChangelogService(
      mockModel,
      mockProvider,
      mockConfigService as ConfigService,
    );
  });

  describe('Test 1 — Mock and upsert', () => {
    it('synchronizes deterministic mock PR into DB and marks source as mock', async () => {
      const result = await service.syncLatestPullRequest();

      expect(result.entry).toBeDefined();
      expect(result.entry?.source).toBe('mock');
      expect(result.entry?.prNumber).toBe(42);
      expect(result.entry?.title).toBe('fix login cookie flags');
      expect(result.entry?.authorLogin).toBe('alice');
      expect(result.entry?.baseBranch).toBe('main');

      const key = 'mock:darksoul-atik:6s_intern_project:42';
      expect(inMemoryDb.has(key)).toBe(true);
      expect(inMemoryDb.size).toBe(1);
    });

    it('repeating synchronization performs idempotent upsert without creating duplicates', async () => {
      const sync1 = await service.syncLatestPullRequest();
      const sync2 = await service.syncLatestPullRequest();

      expect(sync1.entry?.prNumber).toBe(42);
      expect(sync2.entry?.prNumber).toBe(42);
      expect(inMemoryDb.size).toBe(1);

      const listing = await service.getEntries();
      expect(listing.entries.length).toBe(1);
      expect(listing.source).toBe('mock');
      expect(listing.entries[0].prNumber).toBe(42);
    });
  });

  describe('Test 2 — Timeout preservation', () => {
    it('simulates provider timeout, rejects with UPSTREAM_TIMEOUT, and preserves existing records', async () => {
      // 1. Seed an existing changelog record
      const seedResult = await service.syncLatestPullRequest();
      expect(seedResult.entry).toBeDefined();
      expect(inMemoryDb.size).toBe(1);

      // 2. Mock provider to throw UpstreamTimeoutException
      const failingProvider: ChangelogProvider = {
        source: 'mock',
        getLatestMergedPullRequest: vi.fn().mockRejectedValue(new UpstreamTimeoutException()),
      };

      const failingService = new ChangelogService(
        mockModel,
        failingProvider,
        mockConfigService as ConfigService,
      );

      // 3. Verify stable timeout error is thrown
      await expect(failingService.syncLatestPullRequest()).rejects.toThrow(
        UpstreamTimeoutException,
      );

      // 4. Verify existing record is unchanged in DB
      expect(inMemoryDb.size).toBe(1);
      const record = inMemoryDb.get('mock:darksoul-atik:6s_intern_project:42');
      expect(record.title).toBe('fix login cookie flags');

      // 5. Verify listing continues to work safely
      const listing = await failingService.getEntries();
      expect(listing.entries.length).toBe(1);
      expect(listing.entries[0].prNumber).toBe(42);
    });
  });

  describe('Test 3 — Rate limiting', () => {
    it('simulates GitHub rate limiting, rejects with UPSTREAM_RATE_LIMITED, and preserves DB', async () => {
      await service.syncLatestPullRequest();
      expect(inMemoryDb.size).toBe(1);

      const rateLimitedProvider: ChangelogProvider = {
        source: 'mock',
        getLatestMergedPullRequest: vi
          .fn()
          .mockRejectedValue(new UpstreamRateLimitedException()),
      };

      const rlService = new ChangelogService(
        mockModel,
        rateLimitedProvider,
        mockConfigService as ConfigService,
      );

      await expect(rlService.syncLatestPullRequest()).rejects.toThrow(
        UpstreamRateLimitedException,
      );

      expect(inMemoryDb.size).toBe(1);
    });
  });

  describe('Repository Validation', () => {
    it('throws InvalidRepositoryException when only one of owner or repo is supplied', async () => {
      await expect(
        service.syncLatestPullRequest({ owner: 'darksoul-atik' }),
      ).rejects.toThrow(InvalidRepositoryException);

      await expect(
        service.syncLatestPullRequest({ repo: '6S_Intern_Project' }),
      ).rejects.toThrow(InvalidRepositoryException);
    });

    it('throws InvalidRepositoryException on invalid repository characters', async () => {
      await expect(
        service.syncLatestPullRequest({
          owner: 'invalid@owner!',
          repo: 'good-repo',
        }),
      ).rejects.toThrow(InvalidRepositoryException);
    });
  });
});
