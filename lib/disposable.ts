// Common throwaway e-mail domains. Extend as needed.
const DISPOSABLE = new Set([
  '10minutemail.com', '10minutemail.net', '20minutemail.com', 'anonaddy.me', 'burnermail.io',
  'discard.email', 'dispostable.com', 'dropmail.me', 'emailondeck.com', 'fakeinbox.com',
  'fakemail.net', 'getairmail.com', 'getnada.com', 'guerrillamail.com', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamailblock.com', 'harakirimail.com', 'inboxkitten.com',
  'jetable.org', 'mail.tm', 'mail-temp.com', 'mailcatch.com', 'maildrop.cc', 'mailinator.com',
  'mailinator.net', 'mailnesia.com', 'mailpoof.com', 'mintemail.com', 'mohmal.com',
  'moakt.com', 'mytemp.email', 'nada.email', 'sharklasers.com', 'spam4.me', 'spamgourmet.com',
  'temp-mail.io', 'temp-mail.org', 'tempail.com', 'tempmail.dev', 'tempmail.net', 'tempmailo.com',
  'tempr.email', 'throwawaymail.com', 'tmail.ws', 'tmpmail.net', 'tmpmail.org', 'trash-mail.com',
  'trashmail.com', 'trashmail.de', 'trashmail.net', 'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'emailfake.com', 'email-fake.com', 'fexbox.org', 'byom.de', 'wegwerfmail.de', 'einrot.com',
  'cuvox.de', 'dayrep.com', 'armyspy.com', 'gustr.com', 'jourrapide.com', 'rhyta.com',
  'superrito.com', 'teleworm.us', 'mailforspam.com', 'spambox.us', 'trbvm.com', 'vomoto.com',
  'xojxe.com', 'zetmail.com', 'linshiyouxiang.net', 'tempinbox.com', 'mvrht.net',
]);

export function isDisposableEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return true;
  return DISPOSABLE.has(domain) || [...DISPOSABLE].some((d) => domain.endsWith(`.${d}`));
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
