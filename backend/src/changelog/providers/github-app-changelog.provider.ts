import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'node:crypto';
import type {
  ChangelogProvider,
  MergedPullRequest,
} from './changelog-provider.interface.js';
import {
  InvalidRepositoryException,
  RepositoryNotAccessibleException,
  UpstreamAuthFailedException,
  UpstreamForbiddenException,
  UpstreamInvalidResponseException,
  UpstreamRateLimitedException,
  UpstreamTimeoutException,
  UpstreamUnavailableException,
} from '../errors/changelog.errors.js';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';
const USER_AGENT = 'DevPulse-Changelog';
const DEFAULT_TIMEOUT_MS = 3000;

interface GitHubSearchItem {
  number: number;
  title: string;
  user?: {
    login?: string;
  } | null;
  pull_request?: {
    url?: string;
    html_url?: string;
    merged_at?: string | null;
  };
  html_url: string;
}

interface GitHubSearchResponse {
  total_count: number;
  items?: GitHubSearchItem[];
}

interface GitHubPullDetailResponse {
  number: number;
  title: string;
  user?: {
    login?: string;
  } | null;
  merged_at?: string | null;
  html_url: string;
  base?: {
    ref?: string;
    repo?: {
      full_name?: string;
    };
  };
}

@Injectable()
export class GitHubAppChangelogProvider implements ChangelogProvider {
  readonly source = 'github-app' as const;
  private readonly logger = new Logger(GitHubAppChangelogProvider.name);

  constructor(
    private readonly appId: string,
    private readonly installationId: string,
    private readonly privateKeyPem: string,
  ) {}

  async getLatestMergedPullRequest(
    owner: string,
    repo: string,
    options?: { signal?: AbortSignal },
  ): Promise<MergedPullRequest | null> {
    const cleanOwner = owner.toLowerCase().trim();
    const cleanRepo = repo.toLowerCase().trim();

    // Create shared timeout abort controller enforcing 3-second hard deadline
    const timeoutController = new AbortController();
    const timer = setTimeout(() => {
      timeoutController.abort(new Error('Operation timed out'));
    }, DEFAULT_TIMEOUT_MS);

    // If caller provided an external signal, propagate abort
    const externalSignal = options?.signal;
    const onExternalAbort = () => {
      timeoutController.abort(externalSignal?.reason);
    };

    if (externalSignal) {
      if (externalSignal.aborted) {
        clearTimeout(timer);
        throw new UpstreamTimeoutException();
      }
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }

    const sharedSignal = timeoutController.signal;

    try {
      // Step A & B: Exchange GitHub App JWT for Installation Access Token
      const installationToken = await this.getInstallationAccessToken(sharedSignal);

      // Step C: Search for merged PRs targeting main
      return await this.fetchLatestMergedPR(
        cleanOwner,
        cleanRepo,
        installationToken,
        sharedSignal,
      );
    } catch (error: unknown) {
      if (sharedSignal.aborted) {
        throw new UpstreamTimeoutException();
      }
      throw error;
    } finally {
      clearTimeout(timer);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  private generateAppJwt(): string {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
    ).toString('base64url');

    const payload = Buffer.from(
      JSON.stringify({
        iat: now - 60,
        exp: now + 540,
        iss: this.appId,
      }),
    ).toString('base64url');

    const unsignedToken = `${header}.${payload}`;
    try {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(unsignedToken);
      const signature = sign.sign(this.privateKeyPem, 'base64url');
      return `${unsignedToken}.${signature}`;
    } catch {
      throw new UpstreamAuthFailedException(
        'Failed to sign GitHub App authentication token',
      );
    }
  }

  private async getInstallationAccessToken(signal: AbortSignal): Promise<string> {
    const appJwt = this.generateAppJwt();
    const url = `${GITHUB_API_BASE}/app/installations/${this.installationId}/access_tokens`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${appJwt}`,
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
          'User-Agent': USER_AGENT,
        },
        signal,
      });
    } catch (err: unknown) {
      if (signal.aborted) {
        throw new UpstreamTimeoutException();
      }
      throw new UpstreamUnavailableException(
        'Unable to reach GitHub authentication endpoint',
      );
    }

    if (!response.ok) {
      this.handleHttpError(response, 'installation token exchange');
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new UpstreamInvalidResponseException();
    }

    if (
      typeof data === 'object' &&
      data !== null &&
      'token' in data &&
      typeof (data as Record<string, unknown>).token === 'string'
    ) {
      return (data as { token: string }).token;
    }

    throw new UpstreamInvalidResponseException(
      'Missing token in installation response',
    );
  }

  private async fetchLatestMergedPR(
    owner: string,
    repo: string,
    token: string,
    signal: AbortSignal,
  ): Promise<MergedPullRequest | null> {
    const searchQuery = `repo:${owner}/${repo} is:pr is:merged base:main`;
    const searchUrl = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(
      searchQuery,
    )}&sort=updated&order=desc&per_page=10`;

    let searchResponse: Response;
    try {
      searchResponse = await fetch(searchUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
          'User-Agent': USER_AGENT,
        },
        signal,
      });
    } catch (err: unknown) {
      if (signal.aborted) {
        throw new UpstreamTimeoutException();
      }
      throw new UpstreamUnavailableException(
        'Failed to query GitHub Search API',
      );
    }

    if (!searchResponse.ok) {
      this.handleHttpError(searchResponse, 'PR search');
    }

    let searchData: GitHubSearchResponse;
    try {
      searchData = (await searchResponse.json()) as GitHubSearchResponse;
    } catch {
      throw new UpstreamInvalidResponseException();
    }

    if (
      !searchData ||
      typeof searchData.total_count !== 'number' ||
      !Array.isArray(searchData.items) ||
      searchData.items.length === 0
    ) {
      return null;
    }

    // Sort items by actual pull_request.merged_at descending if present
    const candidateItems = searchData.items.filter((item) => item.pull_request);
    if (candidateItems.length === 0) {
      return null;
    }

    candidateItems.sort((a, b) => {
      const timeA = a.pull_request?.merged_at
        ? new Date(a.pull_request.merged_at).getTime()
        : 0;
      const timeB = b.pull_request?.merged_at
        ? new Date(b.pull_request.merged_at).getTime()
        : 0;
      return timeB - timeA;
    });

    const chosenItem = candidateItems[0];
    const prNumber = chosenItem.number;

    // Fetch full PR detail to strictly verify base branch is main and belongs to repo
    const pullUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}`;
    let pullResponse: Response;
    try {
      pullResponse = await fetch(pullUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
          'User-Agent': USER_AGENT,
        },
        signal,
      });
    } catch (err: unknown) {
      if (signal.aborted) {
        throw new UpstreamTimeoutException();
      }
      throw new UpstreamUnavailableException(
        'Failed to fetch PR details from GitHub',
      );
    }

    if (!pullResponse.ok) {
      this.handleHttpError(pullResponse, 'PR detail');
    }

    let pullDetail: GitHubPullDetailResponse;
    try {
      pullDetail = (await pullResponse.json()) as GitHubPullDetailResponse;
    } catch {
      throw new UpstreamInvalidResponseException();
    }

    if (!pullDetail.merged_at) {
      return null;
    }

    const baseBranch = pullDetail.base?.ref || 'main';
    if (baseBranch !== 'main') {
      return null;
    }

    return {
      prNumber: pullDetail.number,
      title: pullDetail.title ? pullDetail.title.slice(0, 500) : 'Untitled PR',
      authorLogin: pullDetail.user?.login || 'unknown',
      mergedAt: new Date(pullDetail.merged_at),
      htmlUrl: pullDetail.html_url,
      baseBranch,
    };
  }

  private handleHttpError(response: Response, action: string): never {
    const status = response.status;
    const isRateLimit =
      status === 429 ||
      (status === 403 &&
        response.headers.get('x-ratelimit-remaining') === '0');

    if (isRateLimit) {
      throw new UpstreamRateLimitedException();
    }

    if (status === 401) {
      throw new UpstreamAuthFailedException();
    }

    if (status === 403) {
      throw new UpstreamForbiddenException();
    }

    if (status === 404) {
      throw new RepositoryNotAccessibleException();
    }

    if (status === 422) {
      throw new InvalidRepositoryException();
    }

    if (status >= 500) {
      throw new UpstreamUnavailableException();
    }

    throw new UpstreamInvalidResponseException(
      `Unexpected HTTP status ${status} during ${action}`,
    );
  }
}
