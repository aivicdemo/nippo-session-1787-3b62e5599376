import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次報告データ抽出', () => {
  // SCEN-2406
  test('アーカイブ保持期限が指定されていないとき処理が中断される', () => {
    const input = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      archiveRetentionPeriodDays: undefined,
    };

    expect(() => extractMonthlyReportData(input)).toThrow(/アーカイブ保持期限/);
  });
});