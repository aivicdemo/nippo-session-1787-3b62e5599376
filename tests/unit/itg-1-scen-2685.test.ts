import { describe, test, expect } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 前日報告内容取得機能', () => {
  // SCEN-2685
  test('チームIDがnullのとき、エラーが発生する', () => {
    const engineerId = 'engineer_001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'manager_001';
    const teamId = null;

    expect(() =>
      fetchYesterdayReport(
        {
          engineerId,
          targetDate,
          requestingUserId,
        },
        teamId as any
      )
    ).toThrow(/チームIDは必須です/);
  });
});