import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AuthModule } from '../auth/auth.module.js';
import { ChangelogController } from './changelog.controller.js';
import { ChangelogService } from './changelog.service.js';
import {
  ChangelogEntry,
  ChangelogEntrySchema,
} from './schemas/changelog-entry.schema.js';
import { CHANGELOG_PROVIDER_TOKEN } from './providers/changelog-provider.interface.js';
import { GitHubAppChangelogProvider } from './providers/github-app-changelog.provider.js';
import { MockChangelogProvider } from './providers/mock-changelog.provider.js';
import { ProviderMisconfiguredException } from './errors/changelog.errors.js';

function resolvePrivateKey(keyPath: string): string | null {
  const candidatePaths = [
    path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath),
    path.resolve(process.cwd(), 'backend', keyPath),
    path.resolve(process.cwd(), 'secrets', path.basename(keyPath)),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        return fs.readFileSync(candidate, 'utf8');
      }
    } catch {
      // Continue to next candidate
    }
  }

  return null;
}

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    MongooseModule.forFeature([
      {
        name: ChangelogEntry.name,
        schema: ChangelogEntrySchema,
      },
    ]),
  ],
  controllers: [ChangelogController],
  providers: [
    ChangelogService,
    {
      provide: CHANGELOG_PROVIDER_TOKEN,
      useFactory: (configService: ConfigService) => {
        const mode = (
          configService.get<string>('CHANGELOG_PROVIDER') || 'auto'
        )
          .toLowerCase()
          .trim();
        const appId = configService.get<string>('GITHUB_APP_ID')?.trim();
        const installationId = configService
          .get<string>('GITHUB_APP_INSTALLATION_ID')
          ?.trim();
        const keyPath =
          configService.get<string>('GITHUB_APP_PRIVATE_KEY_PATH')?.trim() ||
          './secrets/github-app.pem';

        const privateKeyPem = resolvePrivateKey(keyPath);
        const hasRealCredentials = Boolean(
          appId && installationId && privateKeyPem,
        );

        if (mode === 'github-app') {
          if (!hasRealCredentials) {
            throw new ProviderMisconfiguredException(
              'GitHub App credentials (APP_ID, INSTALLATION_ID, or PRIVATE_KEY_PATH) are missing or invalid',
            );
          }
          return new GitHubAppChangelogProvider(
            appId!,
            installationId!,
            privateKeyPem!,
          );
        }

        if (mode === 'mock') {
          return new MockChangelogProvider();
        }

        // 'auto' mode: Use real provider if all credentials exist, otherwise mock
        if (hasRealCredentials) {
          return new GitHubAppChangelogProvider(
            appId!,
            installationId!,
            privateKeyPem!,
          );
        }

        return new MockChangelogProvider();
      },
      inject: [ConfigService],
    },
  ],
  exports: [ChangelogService],
})
export class ChangelogModule {}
