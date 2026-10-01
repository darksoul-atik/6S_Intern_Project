import Groq from 'groq-sdk';
import {
  SummarizerRateLimitError,
  SummarizerUnavailableError,
} from '../errors/summarizer.errors.js';
import type {
  SummarizerInput,
  SummarizerProvider,
} from './summarizer-provider.interface.js';

const MAX_BODY_LENGTH = 12_000;

const SYSTEM_PROMPT = `
You summarize developer-community posts.

Return ONLY one valid JSON object.
Do not use Markdown, code fences, commentary, or text outside the JSON object.

The object must contain exactly two properties:
- "summary": a concise plain-text summary of the supplied post.
- "tags": an array of concise technical skill or technology names supported by the post.

Do not invent technologies or facts that are not present in the post.
Return at most 5 tags.

Required JSON shape:
{"summary":"string","tags":["string"]}
`.trim();

export class GroqSummarizerProvider implements SummarizerProvider {
  private readonly client: Groq;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Groq({
      apiKey,
    });
  }

  async summarize(input: SummarizerInput): Promise<unknown> {
    const body = input.body.slice(0, MAX_BODY_LENGTH);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0,
        response_format: {
          type: 'json_object',
        },
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: this.createUserPrompt(input.title, body),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        return null;
      }

      try {
        const parsed = JSON.parse(content) as Record<string, unknown>;
        return {
          ...parsed,
          provider: 'Groq',
        };
      } catch {
        return content;
      }
    } catch (error: unknown) {
      if (this.getStatusCode(error) === 429) {
        throw new SummarizerRateLimitError();
      }

      throw new SummarizerUnavailableError();
    }
  }

  private getStatusCode(error: unknown): number | undefined {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number'
    ) {
      return error.status;
    }

    return undefined;
  }

  private createUserPrompt(title: string, body: string): string {
    return [
      'Summarize the following post.',
      '',
      'TITLE:',
      title,
      '',
      'BODY:',
      body,
      '',
      'Required JSON shape:',
      '{"summary":"string","tags":["string"]}',
    ].join('\n');
  }
}
