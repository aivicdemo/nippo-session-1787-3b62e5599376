import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  // SCEN-2037: [error] 対策案・実行計画の必須項目検証 - 実行予算額がnullのとき検証エラーになる
  test('should reject submission when executionBudgetAmount is null', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API implementation for user authentication module',
      todayPlan: 'Review code changes and prepare for deployment',
      challenges: 'Database performance issue when processing large datasets needs optimization',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/実行予算額/);
  });
});