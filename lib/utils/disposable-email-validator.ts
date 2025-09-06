import { extractEmailDomain } from "@/lib/utils/email-domain";

// Comprehensive list of disposable email domains
// Updated from https://github.com/disposable-email-domains/disposable-email-domains
// This list contains the most common disposable email services for performance
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  // 10 minute mail services
  "0-mail.com", "027168.com", "062e.com", "0815.ru", "0815.su", "0845.ru", "0box.eu",
  "0cd.cn", "0clickemail.com", "0n0ff.net", "0nelce.com", "0rg.fr", "0v.ro", "0w.ro",
  "0wnd.net", "0wnd.org", "0x207.info", "1-8.biz", "1-second-mail.site", "1-tm.com",
  "10-minute-mail.com", "1000rebates.stream", "100likers.com", "105kg.ru", "10dk.email",
  "10mail.com", "10mail.org", "10mail.tk", "10mail.xyz", "10minmail.de", "10minut.com.pl",
  "10minut.xyz", "10minutemail.be", "10minutemail.cf", "10minutemail.co.uk",
  "10minutemail.co.za", "10minutemail.com", "10minutemail.de", "10minutemail.ga",
  "10minutemail.gq", "10minutemail.ml", "10minutemail.net", "10minutemail.nl",
  "10minutemail.pro", "10minutemail.us", "10minutemailbox.com", "10minutemails.in",
  "10minutenemail.de", "10minutenmail.xyz", "10x9.com", "11mail.com", "123-m.com",
  "123mail.org", "12hourfreemail.com", "12minutemail.com", "12minutemail.net",
  
  // Common well-known disposable services
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamailblock.com",
  "guerrillamail.biz", "guerrillamail.de", "grr.la", "sharklasers.com",
  "temp-mail.org", "tempmail.org", "tempmail.com", "temp-mail.io", "temp-mail.net",
  "throwaway.email", "throwawaymail.com", "yopmail.com", "yopmail.fr", "yopmail.net",
  "mailinator.com", "mailinator.net", "mailinator.org", "mailinator2.com",
  "getnada.com", "maildrop.cc", "dispostable.com", "tempail.com", "tempinbox.com",
  "fakeinbox.com", "spamgourmet.com", "mailcatch.com", "trashmail.com", "trashmail.net",
  "fakemailgenerator.com", "minute.email.com", "e4ward.com", "no-spam.ws", "spam4.me",
  "trbvm.com", "emailondeck.com", "mytrashmail.com", "tempemailer.com", "tempemail.com",
  
  // 20 minute mail services
  "20minutemail.com", "30minutemail.com", "60minutemail.com", "33mail.com", "7days-email.com",
  
  // Other common patterns
  "1337.cf", "13tm.com", "1471.ru", "14n.co.uk", "150mail.com", "15qm.com", "1661.net",
  "2120001.net", "321mail.com", "365-mail.tk", "365box.org", "365email.org", "365temporary.com",
  "3d-game.com", "3mail.ga", "4-5.live", "4chanmail.com", "4gw.pw", "4mail.cf", "4mail.ga",
  "4warding.com", "4warding.net", "4warding.org", "50e.info", "5amigos.com", "5emails.com",
  "5mail.cf", "5mail.ga", "675hosting.com", "675hosting.net", "675hosting.org", "69.fa.gq",
  "6ip.us", "6mail.cf", "6mail.ga", "6mail.ml", "6paq.com", "6url.com", "75hosting.com",
  "75hosting.net", "75hosting.org", "7mail.ga", "7mail.ml", "8125.me", "8mail.cf",
  "8mail.ga", "8mail.ml", "8startpage.com", "9mail.cf", "9ox.net",
  
  // Additional popular temporary email services
  "MailDrop.cc", "nada.email", "mohmal.com", "emailfake.com", "throwam.com",
  "incognitomail.org", "anonymbox.com", "sogetthis.com", "spamherald.com",
  "spamstack.net", "spamthis.co.uk", "tempemail.co.uk", "tempemail.net", "tempsky.com",
  "thankyou2010.com", "trash2009.com", "trashdevil.com", "trashemail.de", "trashymail.com",
  "tyldd.com", "uggsrock.com", "wegwerfmail.de", "wegwerfmail.net", "wegwerfmail.org",
  "wetrainbayarea.com", "wetrainbayarea.org", "wh4f.org", "whyspam.me", "willselfdestruct.com",
  "xoxy.net", "yogamaven.com", "zoemail.org", "zoemail.net", "zzz.com",
]);

/**
 * Checks if an email address uses a disposable email domain
 * @param email The email address to check
 * @returns boolean indicating if the email uses a disposable domain
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const domain = extractEmailDomain(email);
  if (!domain) {
    return false;
  }

  // Remove the @ prefix from the domain if it exists
  const cleanDomain = domain.startsWith("@") ? domain.slice(1) : domain;
  
  return DISPOSABLE_EMAIL_DOMAINS.has(cleanDomain.toLowerCase());
}

/**
 * Validates email against disposable domains and returns error info
 * @param email The email address to validate
 * @returns object with isDisposable flag and optional error message
 */
export function checkDisposableEmail(email: string): {
  isDisposable: boolean;
  error?: string;
} {
  if (!email || typeof email !== "string") {
    return { isDisposable: false };
  }

  const isDisposable = isDisposableEmail(email);
  
  return {
    isDisposable,
    error: isDisposable 
      ? "Disposable email addresses are not allowed. Please use a permanent email address."
      : undefined,
  };
}