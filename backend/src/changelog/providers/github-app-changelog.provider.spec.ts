import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as crypto from 'node:crypto';
import { GitHubAppChangelogProvider } from './github-app-changelog.provider.js';
import {
  InvalidRepositoryException,
  RepositoryNotAccessibleException,
  UpstreamAuthFailedException,
  UpstreamForbiddenException,
  UpstreamRateLimitedException,
  UpstreamTimeoutException,
  UpstreamUnavailableException,
} from '../errors/changelog.errors.js';

describe('GitHubAppChangelogProvider', () => {
  let provider: GitHubAppChangelogProvider;
  let privateKeyPem: string;

  beforeEach(() => {
    // Generate fresh RSA key in memory for testing
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

    provider = new GitHubAppChangelogProvider('12345', '67890', privateKeyPem);
  });

  it('maps HTTP 401 on token exchange to UpstreamAuthFailedException', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({ message: 'Bad credentials' }),
    } as any);

    await expect(
      provider.getLatestMergedPullRequest('owner', 'repo'),
    ).rejects.toThrow(UpstreamAuthFailedException);

    fetchSpy.mockRestore();
  });

  it('maps HTTP 403 with x-ratelimit-remaining: 0 to UpstreamRateLimitedException', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: new Headers({ 'x-ratelimit-remaining': '0' }),
      json: async () => ({ message: 'API rate limit exceeded' }),
    } as any);

    await expect(
      provider.getLatestMergedPullRequest('owner', 'repo'),
    ).rejects.toThrow(UpstreamRateLimitedException);

    fetchSpy.mockRestore();
  });

  it('maps HTTP 403 without rate limit to UpstreamForbiddenException', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: new Headers({ 'x-ratelimit-remaining': '60' }),
      json: async () => ({ message: 'Resource not accessible' }),
    } as any);

    await expect(
      provider.getLatestMergedPullRequest('owner', 'repo'),
    ).rejects.toThrow(UpstreamForbiddenException);

    fetchSpy.mockRestore();
  });

  it('maps HTTP 404 to RepositoryNotAccessibleException', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ token: 'mock-install-token' }),
      } as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: async () => ({ message: 'Not Found' }),
      } as any);

    await expect(
      provider.getLatestMergedPullRequest('owner', 'nonexistent-repo'),
    ).rejects.toThrow(RepositoryNotAccessibleException);

    fetchSpy.mockRestore();
  });

  it('maps HTTP 422 to InvalidRepositoryException', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ token: 'mock-install-token' }),
      } as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: new Headers(),
        json: async () => ({ message: 'Validation Failed' }),
      } as any);

    await expect(
      provider.getLatestMergedPullRequest('invalid', 'repo'),
    ).rejects.toThrow(InvalidRepositoryException);

    fetchSpy.mockRestore();
  });

  it('maps AbortSignal / network timeout to UpstreamTimeoutException', async () => {
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      provider.getLatestMergedPullRequest('owner', 'repo', {
        signal: abortController.signal,
      }),
    ).rejects.toThrow(UpstreamTimeoutException);
  });

  it('maps network failures to UpstreamUnavailableException', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND api.github.com'));

    await expect(
      provider.getLatestMergedPullRequest('owner', 'repo'),
    ).rejects.toThrow(UpstreamUnavailableException);

    fetchSpy.mockRestore();
  });
});
