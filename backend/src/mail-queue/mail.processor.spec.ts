import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Job } from 'bullmq';
import { UnrecoverableError } from 'bullmq';
import { MailProcessor } from './mail.processor.js';
import {
  WELCOME_EMAIL_JOB,
  type WelcomeEmailJobPayload,
} from './mail-queue.constants.js';

describe('MailProcessor', () => {
  let processor: MailProcessor;
  let mockUsersService: any;
  let mockMailService: any;

  beforeEach(() => {
    mockUsersService = {
      findByIdForEmailProcessing: vi.fn(),
      setWelcomeEmailSentAt: vi.fn().mockResolvedValue(undefined),
    };

    mockMailService = {
      sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
    };

    processor = new MailProcessor(mockUsersService, mockMailService);
  });

  const createMockJob = (
    data: Partial<WelcomeEmailJobPayload> = { userId: '507f1f77bcf86cd799439011' },
    name = WELCOME_EMAIL_JOB,
  ): Job<WelcomeEmailJobPayload> =>
    ({
      id: 'job-1',
      name,
      data,
    }) as unknown as Job<WelcomeEmailJobPayload>;

  it('should process welcome email successfully and set sent timestamp', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Ada Lovelace',
      email: 'ada@devpulse.io',
      isDeleted: false,
      welcomeEmailSentAt: null,
    };
    mockUsersService.findByIdForEmailProcessing.mockResolvedValue(mockUser);

    const job = createMockJob();
    await processor.process(job);

    expect(mockUsersService.findByIdForEmailProcessing).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
    expect(mockMailService.sendWelcomeEmail).toHaveBeenCalledWith({
      id: '507f1f77bcf86cd799439011',
      name: 'Ada Lovelace',
      email: 'ada@devpulse.io',
    });
    expect(mockUsersService.setWelcomeEmailSentAt).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      expect.any(Date),
    );
  });

  it('should ignore jobs with unknown job name', async () => {
    const job = createMockJob(
      { userId: '507f1f77bcf86cd799439011' },
      'some-other-job',
    );

    await processor.process(job);

    expect(mockUsersService.findByIdForEmailProcessing).not.toHaveBeenCalled();
    expect(mockMailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('should throw UnrecoverableError if userId is missing', async () => {
    const job = createMockJob({ userId: '' });

    await expect(processor.process(job)).rejects.toBeInstanceOf(
      UnrecoverableError,
    );
  });

  it('should skip permanently if user is not found in database', async () => {
    mockUsersService.findByIdForEmailProcessing.mockResolvedValue(null);

    const job = createMockJob();
    await processor.process(job);

    expect(mockMailService.sendWelcomeEmail).not.toHaveBeenCalled();
    expect(mockUsersService.setWelcomeEmailSentAt).not.toHaveBeenCalled();
  });

  it('should skip if user is soft-deleted', async () => {
    mockUsersService.findByIdForEmailProcessing.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      isDeleted: true,
    });

    const job = createMockJob();
    await processor.process(job);

    expect(mockMailService.sendWelcomeEmail).not.toHaveBeenCalled();
    expect(mockUsersService.setWelcomeEmailSentAt).not.toHaveBeenCalled();
  });

  it('should skip idempotently if welcome email was already sent', async () => {
    mockUsersService.findByIdForEmailProcessing.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      welcomeEmailSentAt: new Date(),
    });

    const job = createMockJob();
    await processor.process(job);

    expect(mockMailService.sendWelcomeEmail).not.toHaveBeenCalled();
    expect(mockUsersService.setWelcomeEmailSentAt).not.toHaveBeenCalled();
  });

  it('should rethrow on mail provider transient failure without setting timestamp', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Ada Lovelace',
      email: 'ada@devpulse.io',
      isDeleted: false,
      welcomeEmailSentAt: null,
    };
    mockUsersService.findByIdForEmailProcessing.mockResolvedValue(mockUser);
    mockMailService.sendWelcomeEmail.mockRejectedValue(
      new Error('SMTP timeout'),
    );

    const job = createMockJob();
    await expect(processor.process(job)).rejects.toThrow('SMTP timeout');

    expect(mockUsersService.setWelcomeEmailSentAt).not.toHaveBeenCalled();
  });
});
