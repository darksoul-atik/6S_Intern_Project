export interface WelcomeEmailData {
  name: string;
  frontendUrl: string;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

/**
 * Escapes HTML characters to prevent XSS / HTML injection in email clients.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderWelcomeEmail(data: WelcomeEmailData): RenderedEmail {
  const rawName = data.name.trim() || 'Developer';
  const safeName = escapeHtml(rawName);
  const safeFrontendUrl = data.frontendUrl.replace(/\/+$/, '');
  const exploreUrl = `${safeFrontendUrl}/posts`;

  const subject = `Welcome to DevPulse, ${rawName}!`;

  const text = `Hello ${rawName},

Welcome to DevPulse! Your account has been successfully created.

Explore developer discussions, share insights, and connect with peers:
${exploreUrl}

Happy coding,
The DevPulse Team`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden;">
    <tr>
      <td style="padding: 32px 24px; text-align: center; border-bottom: 1px solid #1f2937; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
          Dev<span style="color: #6366f1;">Pulse</span>
        </h1>
        <p style="margin: 6px 0 0; font-size: 14px; color: #9ca3af;">
          The Developer Community Platform
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #ffffff;">
          Welcome aboard, ${safeName}!
        </h2>
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #d1d5db;">
          Your account is now ready. Join developers sharing knowledge, publishing technical articles, and building their professional portfolios.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
          <tr>
            <td style="border-radius: 8px; background-color: #6366f1;">
              <a href="${escapeHtml(exploreUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                Explore Community Feed &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.5; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 20px;">
          If the button above does not work, copy and paste this link into your browser:<br>
          <a href="${escapeHtml(exploreUrl)}" style="color: #6366f1; text-decoration: underline;">${escapeHtml(exploreUrl)}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 24px; background-color: #0f172a; text-align: center; font-size: 12px; color: #6b7280;">
        &copy; ${new Date().getFullYear()} DevPulse. Built for developers.
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    text,
    html,
  };
}
