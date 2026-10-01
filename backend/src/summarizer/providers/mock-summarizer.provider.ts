import type {
  SummarizerInput,
  SummarizerProvider,
} from './summarizer-provider.interface.js';

const MAX_SUMMARY_LENGTH = 280;
const MAX_TAGS = 5;

const SKILL_KEYWORDS = [
  { keywords: ['javascript'], tag: 'JavaScript' },
  { keywords: ['typescript'], tag: 'TypeScript' },
  { keywords: ['react'], tag: 'React' },
  { keywords: ['next.js', 'nextjs'], tag: 'Next.js' },
  { keywords: ['nestjs'], tag: 'NestJS' },
  { keywords: ['node.js', 'nodejs'], tag: 'Node.js' },
  { keywords: ['mongodb'], tag: 'MongoDB' },
  { keywords: ['mongoose'], tag: 'Mongoose' },
  { keywords: ['python'], tag: 'Python' },
  { keywords: ['machine learning'], tag: 'Machine Learning' },
  { keywords: ['docker'], tag: 'Docker' },
  { keywords: ['aws'], tag: 'AWS' },
] as const;

export class MockSummarizerProvider implements SummarizerProvider {
  async summarize(input: SummarizerInput): Promise<unknown> {
    const normalizedBody = this.normalizeWhitespace(input.body);

    return {
      summary: this.createSummary(normalizedBody),
      tags: this.createTags(input.title, normalizedBody),
    };
  }

  private normalizeWhitespace(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private createSummary(body: string): string {
    if (!body) {
      return 'No post content available to summarize.';
    }

    const sentences =
      body
        .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
        ?.map((sentence) => sentence.trim()) ?? [];

    const summary = sentences.slice(0, 2).join(' ');

    if (summary.length <= MAX_SUMMARY_LENGTH) {
      return summary;
    }

    return `${summary.slice(0, MAX_SUMMARY_LENGTH - 1)}…`;
  }

  private createTags(title: string, body: string): string[] {
    const searchableText = this.normalizeWhitespace(
      `${title} ${body}`,
    ).toLowerCase();

    return SKILL_KEYWORDS.filter(({ keywords }) =>
      keywords.some((keyword) => searchableText.includes(keyword)),
    )
      .slice(0, MAX_TAGS)
      .map(({ tag }) => tag);
  }
}
