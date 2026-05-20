import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../service.mjs', () => ({
  getShortUrl: vi.fn()
}));

import { getShortUrl } from '../service.mjs';
import { handler } from '../index.mjs';

const mockedGetShortUrl = vi.mocked(getShortUrl);

describe('handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('정상 요청에 200과 shortUrl을 반환한다', async () => {
    mockedGetShortUrl.mockResolvedValue({ shortUrl: 'https://short.example.com/abc12' });

    const result = await handler({ body: JSON.stringify({ url: 'https://www.google.com' }) });

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ shortUrl: 'https://short.example.com/abc12' });
  });

  it('url 누락 시 400을 반환한다', async () => {
    mockedGetShortUrl.mockRejectedValue(Object.assign(new Error('Missing url parameter')));

    const result = await handler({ body: JSON.stringify({}) });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe('Missing url parameter');
  });

  it('DynamoDB 서버 오류 시 500을 반환한다', async () => {
    mockedGetShortUrl.mockRejectedValue(new Error('ProvisionedThroughputExceededException'));

    const result = await handler({ body: JSON.stringify({ url: 'https://www.google.com' }) });

    expect(result.statusCode).toBe(500);
  });

  it('body가 null이면 url 누락으로 처리된다', async () => {
    mockedGetShortUrl.mockRejectedValue(new Error('Missing url parameter'));

    const result = await handler({ body: null });

    expect(result.statusCode).toBe(400);
  });
});
