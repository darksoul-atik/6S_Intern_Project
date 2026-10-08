export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface MailProvider {
  send(options: SendMailOptions): Promise<void>;
}

export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');
