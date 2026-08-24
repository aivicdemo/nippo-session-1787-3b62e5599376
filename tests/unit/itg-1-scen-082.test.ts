import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Deadline Validation with Millisecond Precision', () => {
  // SCEN-082: [edge] 日報送信期限判定機能 - 送信時刻がミリ秒単位の端数を含む場合、秒単位で正しく比較される
  test('should treat all submission timestamps with millisecond precision as on-time when seconds match deadline exactly', async () => {
    const systemDeadlineInSeconds = 9 * 3600; // 09:00:00 UTC in seconds since midnight

    const testCases = [
      {
        timestamp: new Date('2024-01-15T09:00:00.000Z'),
        expectedIsOnTime: true,
        description: 'milliseconds = 0 (exactly at deadline)',
      },
      {
        timestamp: new Date('2024-01-15T09:00:00.123Z'),
        expectedIsOnTime: true,
        description: 'milliseconds = 123 (within 1/1000 second after deadline)',
      },
      {
        timestamp: new Date('2024-01-15T09:00:00.999Z'),
        expectedIsOnTime: true,
        description: 'milliseconds = 999 (within 1/1000 second after deadline)',
      },
    ];

    for (const testCase of testCases) {
      const input: SubmitDailyReportInput = {
        userId: 'user-001',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Completed feature X implementation',
        todayPlan: 'Review and merge pull requests',
        challenges: 'Database performance issues on production',
        reportDate: '2024-01-15',
      };

      const result: SubmitDailyReportOutput = await submitDailyReport(
        input,
        testCase.timestamp,
        systemDeadlineInSeconds,
      );

      expect(result.isWithinDeadline).toBe(testCase.expectedIsOnTime);
      expect(result.submissionTimestamp).toBe(testCase.timestamp.toISOString());
      expect(result.reportId).toBeDefined();
      expect(typeof result.reportId).toBe('string');
      expect(result.reportId.length).toBeGreaterThan(0);
    }
  });
});