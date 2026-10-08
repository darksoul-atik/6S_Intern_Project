import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';

import { UsersModule } from './users/users.module.js';
import { MailModule } from './mail/mail.module.js';
import { MailProducerModule } from './mail-queue/mail-producer.module.js';
import { MailProcessor } from './mail-queue/mail.processor.js';
import { getRedisConfig } from './common/config/mail-queue.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisConfig = getRedisConfig(configService);
        return {
          connection: {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),

    UsersModule,
    MailModule,
    MailProducerModule,
  ],
  providers: [MailProcessor],
})
export class WorkerModule {}
