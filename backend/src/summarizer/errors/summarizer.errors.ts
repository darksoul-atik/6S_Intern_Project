export class SummarizerTimeoutError extends Error {
  constructor() {
    super('Summarizer request timed out');
    this.name = 'SummarizerTimeoutError';
  }
}

export class SummarizerMalformedOutputError extends Error {
  constructor() {
    super('Summarizer returned an invalid response');
    this.name = 'SummarizerMalformedOutputError';
  }
}

export class SummarizerUnavailableError extends Error {
  constructor() {
    super('Summarizer service is unavailable');
    this.name = 'SummarizerUnavailableError';
  }
}

export class SummarizerRateLimitError extends Error {
  constructor() {
    super('Summarizer rate limit reached');
    this.name = 'SummarizerRateLimitError';
  }
}
