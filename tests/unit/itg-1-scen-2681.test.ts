import { describe, test, expect } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport', () => {
  test('SCEN-2681: [error] 前日報告内容取得機能 - ユーザーID が空文字のとき、エラーが発生する', () => {
    const engineerId = '';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'user-001';

    expect(() =>
      fetchYesterdayReport({
        engineerId,
        targetDate,
        requestingUserId,
      })
    ).toThrow(/ユーザーID/);
  });
});