import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../shared/config.mjs', () => ({
  config: {
    baseUrl: 'https://short.example.com',
    tableName: 'test-table',
    codeLength: 5
  }
}));

import generateCode from '../shortCode.mjs';

const BASE62 = /^[a-zA-Z0-9]+$/;

describe('generateCode', () => {
  it('설정한 길이(5)의 코드를 생성한다', () => {
    expect(generateCode()).toHaveLength(5);
  });

  it('Base62 문자(영문 대소문자 + 숫자)만 포함한다', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateCode()).toMatch(BASE62);
    }
  });

  it('호출마다 다른 코드를 생성한다 (무작위성)', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
