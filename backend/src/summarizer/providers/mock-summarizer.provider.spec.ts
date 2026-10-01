import { describe, expect, it } from 'vitest';
import { MockSummarizerProvider } from './mock-summarizer.provider.js';
import { isSummarizerResult } from '../types/summarizer-result.js';

describe('MockSummarizerProvider', () => {
  const provider = new MockSummarizerProvider();

  describe('Very Short Posts', () => {
    it('should summarize a very short post (single sentence) without error', async () => {
      const result = await provider.summarize({
        title: 'Quick question about React',
        body: 'How does useEffect handle dependencies?',
      });

      expect(isSummarizerResult(result)).toBe(true);
      expect((result as any).summary).toBe('How does useEffect handle dependencies?');
      expect((result as any).tags).toContain('React');
    });

    it('should return a graceful fallback for empty post body', async () => {
      const result = await provider.summarize({
        title: 'TypeScript tip',
        body: '',
      });

      expect(isSummarizerResult(result)).toBe(true);
      expect((result as any).summary).toBe('No post content available to summarize.');
      expect((result as any).tags).toContain('TypeScript');
    });

    it('should return empty tags if no keywords match a short post', async () => {
      const result = await provider.summarize({
        title: 'Lunch meeting',
        body: 'Team is meeting at noon for pizza.',
      });

      expect(isSummarizerResult(result)).toBe(true);
      expect((result as any).summary).toBe('Team is meeting at noon for pizza.');
      expect((result as any).tags).toEqual([]);
    });
  });

  describe('Very Long Posts', () => {
    it('should bound the summary of a very long post to 280 characters with an ellipsis', async () => {
      const sentence1 = 'This is the first comprehensive overview of the architecture used in our distributed systems with many complex components across multiple cloud providers and data centers.'.repeat(2);
      const sentence2 = 'This is the second detailed explanation covering data consistency, message queues, and high availability across all regions worldwide.'.repeat(2);
      const sentence3 = 'This third sentence should be ignored because only the lead sentences are summarized.';

      const longBody = `${sentence1}. ${sentence2}. ${sentence3}.`;

      const result = await provider.summarize({
        title: 'Large Architecture Guide with Docker and AWS',
        body: longBody,
      });

      expect(isSummarizerResult(result)).toBe(true);
      const summary = (result as any).summary;
      expect(summary.length).toBeLessThanOrEqual(280);
      expect(summary.endsWith('…')).toBe(true);
      expect((result as any).tags).toEqual(expect.arrayContaining(['Docker', 'AWS']));
    });
  });
});
