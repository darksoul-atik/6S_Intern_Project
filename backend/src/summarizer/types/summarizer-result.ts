export interface SummarizerResult {
  summary: string;
  tags: string[];
  provider?: 'Groq' | 'Mock';
}

const MAX_SUMMARY_LENGTH = 1000;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;

export function isSummarizerResult(value: unknown): value is SummarizerResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const result = value as Record<string, unknown>;
  const keys = Object.keys(result);
  const allowedKeys = ['summary', 'tags', 'provider'];

  if (
    !keys.every((key) => allowedKeys.includes(key)) ||
    !keys.includes('summary') ||
    !keys.includes('tags')
  ) {
    return false;
  }

  if (
    'provider' in result &&
    result.provider !== undefined &&
    result.provider !== 'Groq' &&
    result.provider !== 'Mock'
  ) {
    return false;
  }

  if (
    typeof result.summary !== 'string' ||
    result.summary.trim().length === 0 ||
    result.summary.length > MAX_SUMMARY_LENGTH
  ) {
    return false;
  }

  if (!Array.isArray(result.tags) || result.tags.length > MAX_TAGS) {
    return false;
  }

  if (
    !result.tags.every(
      (tag) =>
        typeof tag === 'string' &&
        tag.trim().length > 0 &&
        tag.length <= MAX_TAG_LENGTH,
    )
  ) {
    return false;
  }

  if (new Set(result.tags).size !== result.tags.length) {
    return false;
  }

  return true;
}
