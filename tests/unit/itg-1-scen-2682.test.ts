import { describe, test, expect } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 前日報告内容取得機能', () => {
  // SCEN-2682
  test('報告日付が null のとき、エラーが発生する', () => {
    const engineerId = 'engineer-001';
    const targetDate = null as any;
    const requestingUserId = 'manager-001';

    expect(() =>
      fetchYesterdayReport({
        engineerId,
        targetDate,
        requestingUserId,
      })
    ).toThrow(/報告日付/);
  });
});