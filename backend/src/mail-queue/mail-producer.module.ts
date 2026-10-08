import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MAIL_QUEUE_NAME } from './mail-queue.constants.js';
import { MailProducerService } from './mail-producer.service.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: MAIL_QUEUE_NAME,
    }),
  ],
  providers: [MailProducerService],
  exports: [MailProducerService, BullModule],
})
export class MailProducerModule {}
