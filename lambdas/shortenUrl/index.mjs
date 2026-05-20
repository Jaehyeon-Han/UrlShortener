import { getShortUrl } from './service.mjs';

const CLIENT_ERRORS = new Set(['Missing url parameter']);

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? '{}');

    const result = await getShortUrl(body.url);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (err) {
    const isClientError = CLIENT_ERRORS.has(err.message);
    return {
      statusCode: isClientError ? 400 : 500,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};