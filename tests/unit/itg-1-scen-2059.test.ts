import { submitDailyReport, type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit with Same Start End Date Validation', () => {
  // SCEN-2059: [edge] 対策案の必須項目検証機能 - 実行計画の期間開始日と終了日が同日の場合に検証がパスする
  test('should accept countermeasure plan when start date and end date are the same day', () => {
    const submissionTimestamp = new Date('2025-01-15T09:30:00Z');
    const reportDate = '2025-01-15';

    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-engineering-01',
      yesterdayAccomplishment: 'Completed API authentication module implementation and merged to main branch.',
      todayPlan: 'Begin database schema optimization and conduct performance testing.',
      challenges: 'Database query performance degradation detected in production logs. Requires immediate investigation and optimization.',
      reportDate: reportDate,
    };

    const result: SubmitDailyReportOutput = submitDailyReport(input, submissionTimestamp);

    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    
    expect(result.submissionTimestamp).toBe(submissionTimestamp.toISOString());
    
    expect(typeof result.isWithinDeadline).toBe('boolean');
    expect(result.isWithinDeadline).toBe(true);
  });
});