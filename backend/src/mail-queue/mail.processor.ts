import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { UnrecoverableError, type Job } from 'bullmq';

import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import {
  MAIL_QUEUE_NAME,
  WELCOME_EMAIL_JOB,
  type WelcomeEmailJobPayload,
} from './mail-queue.constants.js';

@Processor(MAIL_QUEUE_NAME, {
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
})
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job<WelcomeEmailJobPayload>): Promise<void> {
    if (job.name !== WELCOME_EMAIL_JOB) {
      this.logger.warn(`Ignoring unknown job name: ${job.name} (id: ${job.id})`);
      return;
    }

    const { userId } = job.data;
    if (!userId) {
      this.logger.error(`Job ${job.id} missing userId in payload.`);
      throw new UnrecoverableError('Missing userId in job payload');
    }

    this.logger.log(`Processing welcome email for user: ${userId} (job: ${job.id})`);

    // Fetch user with welcomeEmailSentAt field
    const user = await this.usersService.findByIdForEmailProcessing(userId);

    // If user does not exist in DB, do not retry
    if (!user) {
      this.logger.warn(`User ${userId} not found in database. Skipping permanently.`);
      return;
    }

    // If user was soft-deleted, skip
    if (user.isDeleted) {
      this.logger.warn(`User ${userId} is marked as deleted. Skipping welcome email.`);
      return;
    }

    // Idempotency guard: skip if welcome email was already delivered
    if (user.welcomeEmailSentAt) {
      this.logger.log(
        `User ${userId} already received welcome email at ${user.welcomeEmailSentAt.toISOString()}. Skipping duplicate.`,
      );
      return;
    }

    // Dispatch welcome email via MailService (provider configured by env)
    await this.mailService.sendWelcomeEmail({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    });

    // Mark email as sent to prevent duplicate deliveries on future retries
    await this.usersService.setWelcomeEmailSentAt(userId, new Date());

    this.logger.log(`Welcome email successfully sent and recorded for user: ${userId}`);
  }
}
