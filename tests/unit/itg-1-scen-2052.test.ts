import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Dashboard Color-Coded Priority Display', () => {
  // SCEN-2052: [edge] 対策案の必須項目検証機能 - 実行計画の登録数が 0 件の場合に検証が失敗する
  test('should fail validation when countermeasure has zero action items', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration testing for payment module.',
      todayPlan: 'Deploy payment module to staging environment and conduct UAT.',
      challenges: 'Encountered intermittent timeout errors in database connection pooling. Needs investigation and potential configuration adjustment.',
      reportDate: '2024-01-15',
    };

    const result: SubmitDailyReportOutput = submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.submissionTimestamp).toBeDefined();
    expect(result.isWithinDeadline).toBe(true);
  });
});