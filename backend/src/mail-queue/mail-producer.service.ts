import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  MAIL_QUEUE_NAME,
  WELCOME_EMAIL_JOB,
  type WelcomeEmailJobPayload,
} from './mail-queue.constants.js';

@Injectable()
export class MailProducerService {
  private readonly logger = new Logger(MailProducerService.name);

  constructor(
    @InjectQueue(MAIL_QUEUE_NAME)
    private readonly emailQueue: Queue<WelcomeEmailJobPayload>,
  ) {}

  async enqueueWelcomeEmail(userId: string): Promise<void> {
    const jobId = `welcome-email-${userId}`;

    await this.emailQueue.add(
      WELCOME_EMAIL_JOB,
      { userId },
      {
        jobId,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 10_000,
        },
        removeOnComplete: {
          count: 100,
        },
        removeOnFail: {
          count: 500,
        },
      },
    );

    this.logger.log(`Enqueued welcome email job: ${jobId}`);
  }
}
