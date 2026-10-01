import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  SummarizerMalformedOutputError,
  SummarizerRateLimitError,
  SummarizerTimeoutError,
  SummarizerUnavailableError,
} from './errors/summarizer.errors.js';
import {
  SUMMARIZER_PROVIDER,
  type SummarizerInput,
  type SummarizerProvider,
} from './providers/summarizer-provider.interface.js';
import {
  isSummarizerResult,
  type SummarizerResult,
} from './types/summarizer-result.js';

const SUMMARIZER_TIMEOUT_MS = 8_000;

@Injectable()
export class SummarizerService {
  constructor(
    @Inject(SUMMARIZER_PROVIDER)
    private readonly provider: SummarizerProvider,
  ) {}

  async summarize(input: SummarizerInput): Promise<SummarizerResult> {
    try {
      const result = await this.withTimeout(
        this.provider.summarize(input),
        SUMMARIZER_TIMEOUT_MS,
      );

      if (!isSummarizerResult(result)) {
        throw new SummarizerMalformedOutputError();
      }

      return result;
    } catch (error: unknown) {
      if (error instanceof SummarizerTimeoutError) {
        throw new GatewayTimeoutException('Summarizer request timed out');
      }

      if (error instanceof SummarizerMalformedOutputError) {
        throw new BadGatewayException(
          'Summarizer returned an invalid response',
        );
      }

      if (error instanceof SummarizerRateLimitError) {
        throw new HttpException(
          'Summarizer rate limit reached. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (error instanceof SummarizerUnavailableError) {
        throw new ServiceUnavailableException(
          'Summarizer service is unavailable',
        );
      }

      throw error;
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new SummarizerTimeoutError());
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
