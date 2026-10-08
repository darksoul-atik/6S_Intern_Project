import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  renderWelcomeEmail,
} from './welcome-email.template.js';

describe('Welcome Email Template', () => {
  it('should escape HTML in user names to prevent XSS injection', () => {
    const maliciousName = '<script>alert("xss")</script> & "O\'Reilly"';
    const escaped = escapeHtml(maliciousName);

    expect(escaped).not.toContain('<script>');
    expect(escaped).not.toContain('"');
    expect(escaped).not.toContain("'");
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&amp;');
    expect(escaped).toContain('&quot;O&#39;Reilly&quot;');
  });

  it('should render subject, plain text and html with escaped user name', () => {
    const rendered = renderWelcomeEmail({
      name: '<Developer> Bob',
      frontendUrl: 'https://devpulse.io/',
    });

    expect(rendered.subject).toBe('Welcome to DevPulse, <Developer> Bob!');
    expect(rendered.text).toContain('Hello <Developer> Bob,');
    expect(rendered.text).toContain('https://devpulse.io/posts');
    expect(rendered.html).toContain('&lt;Developer&gt; Bob');
    expect(rendered.html).not.toContain('<Developer> Bob');
    expect(rendered.html).toContain('https://devpulse.io/posts');
  });

  it('should fall back to "Developer" if name is empty or whitespace', () => {
    const rendered = renderWelcomeEmail({
      name: '   ',
      frontendUrl: 'http://localhost:3000',
    });

    expect(rendered.subject).toBe('Welcome to DevPulse, Developer!');
    expect(rendered.text).toContain('Hello Developer,');
    expect(rendered.html).toContain('Welcome aboard, Developer!');
  });
});
