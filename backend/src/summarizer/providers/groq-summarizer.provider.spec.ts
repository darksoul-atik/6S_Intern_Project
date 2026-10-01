import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GroqSummarizerProvider } from './groq-summarizer.provider.js';
import {
  SummarizerRateLimitError,
  SummarizerUnavailableError,
} from '../errors/summarizer.errors.js';

const mockCreate = vi.fn();

vi.mock('groq-sdk', () => {
  return {
    default: class MockGroq {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

describe('GroqSummarizerProvider', () => {
  let provider: GroqSummarizerProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GroqSummarizerProvider('test-key', 'openai/gpt-oss-20b');
  });

  describe('Very Short Posts', () => {
    it('should forward short post directly to the chat completion endpoint', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Brief overview of TypeScript types.',
                tags: ['TypeScript'],
              }),
            },
          },
        ],
      });

      const result = await provider.summarize({
        title: 'Short Tip',
        body: 'TypeScript types are powerful.',
      });

      expect(mockCreate).toHaveBeenCalledOnce();
      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      expect(userMessage.content).toContain('TypeScript types are powerful.');
      expect(result).toEqual({
        summary: 'Brief overview of TypeScript types.',
        tags: ['TypeScript'],
      });
    });
  });

  describe('Very Long Posts', () => {
    it('should truncate posts exceeding 12,000 characters before sending to Groq', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Summary of long documentation.',
                tags: ['Architecture'],
              }),
            },
          },
        ],
      });

      const longBody = 'A'.repeat(20_000);

      await provider.summarize({
        title: 'Massive System Architecture',
        body: longBody,
      });

      expect(mockCreate).toHaveBeenCalledOnce();
      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');

      // Ensure the message body inside prompt contains exactly 12,000 'A' characters, not 20,000
      expect(userMessage.content).toContain('A'.repeat(12_000));
      expect(userMessage.content).not.toContain('A'.repeat(12_001));
    });
  });

  describe('Error Handling', () => {
    it('should map 429 status to SummarizerRateLimitError', async () => {
      mockCreate.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded',
      });

      await expect(
        provider.summarize({
          title: 'Test',
          body: 'Test body',
        }),
      ).rejects.toBeInstanceOf(SummarizerRateLimitError);
    });

    it('should map network/service error to SummarizerUnavailableError', async () => {
      mockCreate.mockRejectedValue(new Error('Connection failed'));

      await expect(
        provider.summarize({
          title: 'Test',
          body: 'Test body',
        }),
      ).rejects.toBeInstanceOf(SummarizerUnavailableError);
    });
  });
});
