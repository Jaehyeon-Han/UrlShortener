import * as repository from '../../shared/repository.mjs';
import * as notifier from './notifier.mjs';

/** @param {string} shortCode */
export async function getOriginalUrl(shortCode) {
  const originalUrl = await repository.getOriginalUrl(shortCode);

  if (!originalUrl) {
    return null;
  }

  try {
    await notifier.notifyDiscord(originalUrl);
  } catch {
    console.error('failed to notify Discord. url was ' + originalUrl);
  }

  return originalUrl;
}