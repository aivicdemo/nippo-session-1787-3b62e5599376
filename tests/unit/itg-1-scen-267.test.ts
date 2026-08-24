import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Delay Calculation', () => {
  // SCEN-267: [edge] 報告遅延判定機能 - 送信時刻が期限を1分超過した場合、遅延時間が正確に計算される
  test('should calculate delay of 1 minute when submission time exceeds deadline by exactly 1 minute', () => {
    const deadline = new Date('2024-01-15T09:00:00Z');
    const submissionTimestamp = new Date('2024-01-15T09:01:00Z');

    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed project setup and documentation',
      todayPlan: 'Begin feature development and code review',
      challenges: 'Dependency version conflicts encountered',
      reportDate: '2024-01-15',
    };

    const result: SubmitDailyReportOutput = submitDailyReport(input, submissionTimestamp, deadline);

    expect(result.isWithinDeadline).toBe(false);
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.submissionTimestamp).toBeDefined();
    expect(result.submissionTimestamp).toBe(submissionTimestamp.toISOString());
  });
});