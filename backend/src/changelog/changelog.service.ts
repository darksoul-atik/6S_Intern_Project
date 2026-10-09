import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChangelogEntry,
  type ChangelogEntryDocument,
} from './schemas/changelog-entry.schema.js';
import {
  CHANGELOG_PROVIDER_TOKEN,
  type ChangelogProvider,
} from './providers/changelog-provider.interface.js';
import type { SyncChangelogDto } from './dto/sync-changelog.dto.js';
import { InvalidRepositoryException } from './errors/changelog.errors.js';

export interface ChangelogListResult {
  entries: ChangelogEntry[];
  lastSyncedAt: Date | null;
  source: string;
}

export interface ChangelogSyncResult {
  entry: ChangelogEntry | null;
  message: string;
}

const GITHUB_OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const GITHUB_REPO_REGEX = /^[a-zA-Z0-9_.-]+$/;

@Injectable()
export class ChangelogService {
  private readonly logger = new Logger(ChangelogService.name);

  constructor(
    @InjectModel(ChangelogEntry.name)
    private readonly changelogModel: Model<ChangelogEntryDocument>,
    @Inject(CHANGELOG_PROVIDER_TOKEN)
    private readonly provider: ChangelogProvider,
    private readonly configService: ConfigService,
  ) {}

  async getEntries(limit = 20): Promise<ChangelogListResult> {
    const safeLimit = Math.min(Math.max(1, limit), 50);

    const entries = await this.changelogModel
      .find({ source: this.provider.source })
      .sort({ mergedAt: -1 })
      .limit(safeLimit)
      .lean()
      .exec();

    let lastSyncedAt: Date | null = null;
    if (entries.length > 0) {
      // Find the most recent syncedAt date
      lastSyncedAt = entries.reduce<Date>((latest, current) => {
        const currentDate = new Date(current.syncedAt);
        return !latest || currentDate > latest ? currentDate : latest;
      }, new Date(entries[0].syncedAt));
    }

    return {
      entries,
      lastSyncedAt,
      source: this.provider.source,
    };
  }

  async syncLatestPullRequest(
    dto?: SyncChangelogDto,
  ): Promise<ChangelogSyncResult> {
    const { owner, repo } = this.resolveAndValidateRepository(dto);

    this.logger.log(
      `Synchronizing changelog for ${owner}/${repo} using provider: ${this.provider.source}`,
    );

    const pullRequest = await this.provider.getLatestMergedPullRequest(
      owner,
      repo,
    );

    if (!pullRequest) {
      return {
        entry: null,
        message: 'No merged pull requests targeting main were found.',
      };
    }

    if (pullRequest.baseBranch !== 'main') {
      return {
        entry: null,
        message: 'Latest merged PR does not target main branch.',
      };
    }

    try {
      const entry = await this.changelogModel
        .findOneAndUpdate(
          {
            source: this.provider.source,
            owner: owner.toLowerCase().trim(),
            repo: repo.toLowerCase().trim(),
            prNumber: pullRequest.prNumber,
          },
          {
            $set: {
              title: pullRequest.title,
              authorLogin: pullRequest.authorLogin,
              mergedAt: pullRequest.mergedAt,
              htmlUrl: pullRequest.htmlUrl,
              baseBranch: pullRequest.baseBranch,
              syncedAt: new Date(),
            },
            $setOnInsert: {
              source: this.provider.source,
              owner: owner.toLowerCase().trim(),
              repo: repo.toLowerCase().trim(),
              prNumber: pullRequest.prNumber,
            },
          },
          {
            upsert: true,
            returnDocument: 'after',
            setDefaultsOnInsert: true,
          },
        )
        .lean()
        .exec();

      return {
        entry,
        message: 'Changelog synchronized successfully',
      };
    } catch (err: unknown) {
      // Handle rare concurrent duplicate-key race gracefully
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: number }).code === 11000
      ) {
        const existing = await this.changelogModel
          .findOne({
            source: this.provider.source,
            owner: owner.toLowerCase().trim(),
            repo: repo.toLowerCase().trim(),
            prNumber: pullRequest.prNumber,
          })
          .lean()
          .exec();

        return {
          entry: existing,
          message: 'Changelog synchronized successfully',
        };
      }

      throw err;
    }
  }

  private resolveAndValidateRepository(dto?: SyncChangelogDto): {
    owner: string;
    repo: string;
  } {
    const hasOwner = Boolean(dto?.owner && dto.owner.trim());
    const hasRepo = Boolean(dto?.repo && dto.repo.trim());

    if (hasOwner !== hasRepo) {
      throw new InvalidRepositoryException(
        'Both owner and repo must be provided together',
      );
    }

    let owner = dto?.owner?.trim();
    let repo = dto?.repo?.trim();

    if (!owner || !repo) {
      const defaultRepo = this.configService.get<string>('CHANGELOG_REPO');
      if (!defaultRepo || !defaultRepo.includes('/')) {
        throw new InvalidRepositoryException(
          'Target repository not specified and CHANGELOG_REPO is not configured',
        );
      }
      const parts = defaultRepo.split('/');
      owner = parts[0]?.trim();
      repo = parts[1]?.trim();
    }

    if (!owner || !repo) {
      throw new InvalidRepositoryException(
        'Repository owner and name could not be resolved',
      );
    }

    if (!GITHUB_OWNER_REGEX.test(owner)) {
      throw new InvalidRepositoryException(
        `Invalid repository owner: "${owner}"`,
      );
    }

    if (!GITHUB_REPO_REGEX.test(repo)) {
      throw new InvalidRepositoryException(
        `Invalid repository name: "${repo}"`,
      );
    }

    return {
      owner: owner.toLowerCase(),
      repo: repo.toLowerCase(),
    };
  }
}
