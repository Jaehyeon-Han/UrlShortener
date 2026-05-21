import { getOriginalUrl } from './service.mjs';

export const handler = async (event) => {
  const shortCode = event.pathParameters?.shortCode;

  if (!shortCode) {
    return {
      statusCode: 400,
      body: "Missing shortCode"
    };
  }

  const originalUrl = await getOriginalUrl(shortCode);

  if (!originalUrl) {
    return {
      statusCode: 404,
      body: "Url not found!"
    }
  }

  return {
    statusCode: 302,
    headers: {
      Location: originalUrl
    }
  }
};
