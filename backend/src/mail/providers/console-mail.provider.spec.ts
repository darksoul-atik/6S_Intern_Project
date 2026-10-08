import { describe, expect, it } from 'vitest';
import {
  ConsoleMailProvider,
  maskEmail,
} from './console-mail.provider.js';

describe('ConsoleMailProvider', () => {
  describe('maskEmail', () => {
    it('should mask standard email addresses safely', () => {
      expect(maskEmail('alexander@devpulse.io')).toBe('a***r@devpulse.io');
      expect(maskEmail('john@example.com')).toBe('j***n@example.com');
      expect(maskEmail('me@example.com')).toBe('m***@example.com');
    });

    it('should handle malformed email input gracefully', () => {
      expect(maskEmail('invalid')).toBe('***@***');
      expect(maskEmail('')).toBe('***@***');
    });
  });

  describe('send', () => {
    it('should execute send without throwing errors in console mode', async () => {
      const provider = new ConsoleMailProvider();
      await expect(
        provider.send({
          to: 'developer@example.com',
          subject: 'Test Subject',
          text: 'Test Text',
          html: '<p>Test</p>',
        }),
      ).resolves.toBeUndefined();
    });
  });
});
