import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  // SCEN-2477: [error] 操作習熟度スコア計算機能 - ユーザーIDが空文字列のとき、エラーを返す
  test('should return INVALID_USER_ID error when userId is empty string', () => {
    const input: SubmitDailyReportInput = {
      userId: '',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration',
      todayPlan: 'Start database optimization',
      challenges: 'Performance issue on production server',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/ユーザーID/);
  });
});