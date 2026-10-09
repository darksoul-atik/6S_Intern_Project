import { HttpException, HttpStatus } from '@nestjs/common';

export type ChangelogErrorCode =
  | 'INVALID_REPOSITORY'
  | 'REPOSITORY_NOT_ACCESSIBLE'
  | 'UPSTREAM_AUTH_FAILED'
  | 'PROVIDER_MISCONFIGURED'
  | 'UPSTREAM_RATE_LIMITED'
  | 'UPSTREAM_FORBIDDEN'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_INVALID_RESPONSE';

export class ChangelogException extends HttpException {
  constructor(
    public readonly code: ChangelogErrorCode,
    message: string,
    status: HttpStatus,
  ) {
    super(
      {
        code,
        message,
        error: code,
      },
      status,
    );
  }
}

export class InvalidRepositoryException extends ChangelogException {
  constructor(message = 'Invalid repository format or name') {
    super('INVALID_REPOSITORY', message, HttpStatus.BAD_REQUEST);
  }
}

export class RepositoryNotAccessibleException extends ChangelogException {
  constructor(message = 'Target repository is not accessible') {
    super('REPOSITORY_NOT_ACCESSIBLE', message, HttpStatus.BAD_REQUEST);
  }
}

export class UpstreamAuthFailedException extends ChangelogException {
  constructor(message = 'GitHub authentication failed') {
    super('UPSTREAM_AUTH_FAILED', message, HttpStatus.BAD_GATEWAY);
  }
}

export class ProviderMisconfiguredException extends ChangelogException {
  constructor(message = 'Changelog provider credentials missing or misconfigured') {
    super('PROVIDER_MISCONFIGURED', message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class UpstreamRateLimitedException extends ChangelogException {
  constructor(message = 'GitHub API rate limit exceeded') {
    super('UPSTREAM_RATE_LIMITED', message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class UpstreamForbiddenException extends ChangelogException {
  constructor(message = 'Permission denied accessing GitHub repository') {
    super('UPSTREAM_FORBIDDEN', message, HttpStatus.BAD_GATEWAY);
  }
}

export class UpstreamTimeoutException extends ChangelogException {
  constructor(message = 'Upstream GitHub operation timed out') {
    super('UPSTREAM_TIMEOUT', message, HttpStatus.GATEWAY_TIMEOUT);
  }
}

export class UpstreamUnavailableException extends ChangelogException {
  constructor(message = 'Upstream GitHub service unavailable or network failure') {
    super('UPSTREAM_UNAVAILABLE', message, HttpStatus.BAD_GATEWAY);
  }
}

export class UpstreamInvalidResponseException extends ChangelogException {
  constructor(message = 'Invalid or malformed upstream response from GitHub') {
    super('UPSTREAM_INVALID_RESPONSE', message, HttpStatus.BAD_GATEWAY);
  }
}
