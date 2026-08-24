import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit Daily Report', () => {
  // SCEN-2543: [edge] 初回テスト報告の入力検証機能 - 入力データの小数点を含む数値が端数である場合、数値形式検証が合格となる
  test('should pass numeric format validation when input contains decimal fractional values', () => {
    const testCases = [
      {
        input: {
          userId: 'engineer-001',
          teamId: 'team-A',
          yesterdayAccomplishment: 'Completed API endpoint development with 75.5% accuracy',
          todayPlan: 'Review code and deploy to staging environment',
          challenges: 'Performance optimization required',
          reportDate: '2024-01-15',
        } as SubmitDailyReportInput,
        decimalPattern: '75.5',
      },
      {
        input: {
          userId: 'engineer-002',
          teamId: 'team-B',
          yesterdayAccomplishment: 'Fixed 12.33 critical bugs in the system',
          todayPlan: 'Write unit tests for new features',
          challenges: 'Database connection timeout issues',
          reportDate: '2024-01-15',
        } as SubmitDailyReportInput,
        decimalPattern: '12.33',
      },
      {
        input: {
          userId: 'engineer-003',
          teamId: 'team-C',
          yesterdayAccomplishment: 'Task completion rate reached 99.9 percent',
          todayPlan: 'Prepare documentation and handover notes',
          challenges: 'Network latency affecting test execution',
          reportDate: '2024-01-15',
        } as SubmitDailyReportInput,
        decimalPattern: '99.9',
      },
    ];

    for (const testCase of testCases) {
      const result: SubmitDailyReportOutput = submitDailyReport(testCase.input);

      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
      expect(typeof result.reportId).toBe('string');
      expect(result.reportId.length).toBeGreaterThan(0);

      expect(result.submissionTimestamp).toBeDefined();
      expect(typeof result.submissionTimestamp).toBe('string');

      const timestamp = new Date(result.submissionTimestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);

      expect(typeof result.isWithinDeadline).toBe('boolean');

      expect(testCase.input.yesterdayAccomplishment).toMatch(/\d+\.\d+/);
      const extractedDecimal = testCase.input.yesterdayAccomplishment.match(/\d+\.\d+/);
      expect(extractedDecimal).not.toBeNull();
      if (extractedDecimal) {
        expect(extractedDecimal[0]).toBe(testCase.decimalPattern);
      }
    }
  });
});