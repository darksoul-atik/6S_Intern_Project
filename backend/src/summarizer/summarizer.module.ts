import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroqSummarizerProvider } from './providers/groq-summarizer.provider.js';
import { MockSummarizerProvider } from './providers/mock-summarizer.provider.js';
import {
  SUMMARIZER_PROVIDER,
  type SummarizerProvider,
} from './providers/summarizer-provider.interface.js';

@Module({
  providers: [
    {
      provide: SUMMARIZER_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): SummarizerProvider => {
        const apiKey = configService.get<string>('GROQ_API_KEY')?.trim();

        if (!apiKey) {
          return new MockSummarizerProvider();
        }

        const model =
          configService.get<string>('GROQ_MODEL')?.trim() ||
          'openai/gpt-oss-20b';

        return new GroqSummarizerProvider(apiKey, model);
      },
    },
  ],
  exports: [SUMMARIZER_PROVIDER],
})
export class SummarizerModule {}
