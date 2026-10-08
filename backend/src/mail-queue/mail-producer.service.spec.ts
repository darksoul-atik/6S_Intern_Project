import { describe, expect, it, vi } from 'vitest';
import type { Queue } from 'bullmq';
import { MailProducerService } from './mail-producer.service.js';
import {
  WELCOME_EMAIL_JOB,
  type WelcomeEmailJobPayload,
} from './mail-queue.constants.js';

describe('MailProducerService', () => {
  it('should enqueue welcome email job with deterministic jobId and backoff options', async () => {
    const mockAdd = vi.fn().mockResolvedValue({ id: 'job-123' });
    const mockQueue = {
      add: mockAdd,
    } as unknown as Queue<WelcomeEmailJobPayload>;

    const producer = new MailProducerService(mockQueue);
    await producer.enqueueWelcomeEmail('64b1f2a3c4d5e6f7a8b9c0d1');

    expect(mockAdd).toHaveBeenCalledOnce();
    const [jobName, payload, options] = mockAdd.mock.calls[0];

    expect(jobName).toBe(WELCOME_EMAIL_JOB);
    expect(payload).toEqual({ userId: '64b1f2a3c4d5e6f7a8b9c0d1' });
    expect(options.jobId).toBe('welcome-email-64b1f2a3c4d5e6f7a8b9c0d1');
    expect(options.attempts).toBe(5);
    expect(options.backoff).toEqual({
      type: 'exponential',
      delay: 10_000,
    });
    expect(options.removeOnComplete).toEqual({ count: 100 });
    expect(options.removeOnFail).toEqual({ count: 500 });
  });

  it('should rethrow if queue.add throws an error', async () => {
    const mockAdd = vi.fn().mockRejectedValue(new Error('Redis connection refused'));
    const mockQueue = {
      add: mockAdd,
    } as unknown as Queue<WelcomeEmailJobPayload>;

    const producer = new MailProducerService(mockQueue);

    await expect(
      producer.enqueueWelcomeEmail('64b1f2a3c4d5e6f7a8b9c0d1'),
    ).rejects.toThrow('Redis connection refused');
  });
});
