import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport', () => {
  // SCEN-2688
  test('[error] 前日報告内容取得機能 - 指定された日付の報告が存在しないとき、エラーが発生する', async () => {
    const engineerId = 'eng_001';
    const requestingUserId = 'user_admin_001';
    const targetDate = new Date('2026-08-15');

    await expect(async () => {
      await fetchYesterdayReport({
        engineerId,
        targetDate,
        requestingUserId,
      });
    }).rejects.toThrow(/REPORT_NOT_FOUND/);
  });
});