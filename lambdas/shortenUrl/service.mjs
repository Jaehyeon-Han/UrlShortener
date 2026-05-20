import { config } from '../../shared/config.mjs';
import * as repository from '../../shared/repository.mjs';
import generateCode from './shortCode.mjs';

export async function getShortUrl(originalUrl) {
  if (!originalUrl) {
    throw new Error('Missing url parameter');
  }

  const existing = await repository.findByOriginalUrl(originalUrl);

  if (existing) {
    return {
      shortUrl: `${config.baseUrl}/${existing.shortCode}`
    };
  }

  while (true) {
    const shortCode = generateCode();

    try {
      await repository.save(shortCode, originalUrl);

      return {
        shortUrl: `${config.baseUrl}/${shortCode}`
      };
    } catch (err) {
      // DynamoDB 직접 의존
      if (err.name !== 'ConditionalCheckFailedException') {
        throw err;
      }
    }
  }
}