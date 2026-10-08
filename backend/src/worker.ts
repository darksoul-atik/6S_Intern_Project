import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker.module.js';

async function bootstrapWorker(): Promise<void> {
  const logger = new Logger('WorkerBootstrap');
  logger.log('🚀 Starting DevPulse Email Worker process...');

  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();

  logger.log('✅ DevPulse Email Worker is active and listening for queue jobs.');

  // Handle graceful shutdown signals
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, gracefully shutting down worker...`);
      await app.close();
      logger.log('Worker context closed cleanly.');
      process.exit(0);
    });
  }
}

bootstrapWorker().catch((error: unknown) => {
  console.error('Fatal error in worker bootstrap:', error);
  process.exit(1);
});
