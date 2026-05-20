import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shared/repository.mjs', () => ({
  findByOriginalUrl: vi.fn(),
  save: vi.fn()
}));

vi.mock('../../../shared/config.mjs', () => ({
  config: {
    baseUrl: 'https://short.example.com',
    tableName: 'test-table',
    codeLength: 5
  }
}));

import * as repository from '../../../shared/repository.mjs';
import { getShortUrl } from '../service.mjs';

const mockedFindByOriginalUrl = vi.mocked(repository.findByOriginalUrl);
const mockedSave = vi.mocked(repository.save);

describe('getShortUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('url이 없으면 에러를 던진다', async () => {
    await expect(getShortUrl(undefined)).rejects.toThrow('Missing url parameter');
    await expect(getShortUrl('')).rejects.toThrow('Missing url parameter');
  });

  it('이미 존재하는 URL이면 기존 shortUrl을 반환한다', async () => {
    mockedFindByOriginalUrl.mockResolvedValue({ shortCode: 'abc12' });

    const result = await getShortUrl('https://www.google.com');

    expect(result).toEqual({ shortUrl: 'https://short.example.com/abc12' });
    expect(mockedSave).not.toHaveBeenCalled();
  });

  it('새 URL이면 저장 후 shortUrl을 반환한다', async () => {
    mockedFindByOriginalUrl.mockResolvedValue(null);
    mockedSave.mockResolvedValue(undefined);

    const result = await getShortUrl('https://www.naver.com');

    expect(result.shortUrl).toMatch(/^https:\/\/short\.example\.com\/[a-zA-Z0-9]{5}$/);
    expect(mockedSave).toHaveBeenCalledOnce();
  });

  it('ConditionalCheckFailedException 발생 시 재시도하여 성공한다', async () => {
    mockedFindByOriginalUrl.mockResolvedValue(null);
    const collision = Object.assign(new Error('Collision'), { name: 'ConditionalCheckFailedException' });
    mockedSave
      .mockRejectedValueOnce(collision)
      .mockResolvedValueOnce(undefined);

    const result = await getShortUrl('https://www.naver.com');

    expect(result.shortUrl).toMatch(/^https:\/\/short\.example\.com\//);
    expect(mockedSave).toHaveBeenCalledTimes(2);
  });

  it('DynamoDB 예상치 못한 에러는 그대로 던진다', async () => {
    mockedFindByOriginalUrl.mockResolvedValue(null);
    mockedSave.mockRejectedValue(new Error('ProvisionedThroughputExceededException'));

    await expect(getShortUrl('https://www.naver.com')).rejects.toThrow('ProvisionedThroughputExceededException');
  });
});
