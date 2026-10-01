export const SUMMARIZER_PROVIDER = Symbol('SUMMARIZER_PROVIDER');

export interface SummarizerInput {
  title: string;
  body: string;
}

export interface SummarizerProvider {
  summarize(input: SummarizerInput): Promise<unknown>;
}
