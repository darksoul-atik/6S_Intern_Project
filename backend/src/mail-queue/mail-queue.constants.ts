export const MAIL_QUEUE_NAME = 'email';
export const WELCOME_EMAIL_JOB = 'welcome';

export interface WelcomeEmailJobPayload {
  userId: string;
}
