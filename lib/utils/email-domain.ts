// Common email providers that should be excluded from organization matching
export const COMMON_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'live.com',
  'msn.com',
  'me.com',
  'mac.com'
]);

export const isOrganizationEmail = (email: string): boolean => {
  const domain = email.split('@')[1];
  return domain ? !COMMON_EMAIL_DOMAINS.has(domain.toLowerCase()) : false;
};

export const getEmailDomain = (email: string): string | null => {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
};