import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Report Submission Across Month Boundaries', () => {
  let originalNow: typeof Date.now;

  beforeEach(() => {
    originalNow = Date.now;
  });

  afterEach(() => {
    Date.now = originalNow;
  });

  // SCEN-083: [edge] 日報送信期限判定機能 - 日報送信が月をまたぐ場合に期限判定が正しく実行される
  test('should correctly determine submission deadline status when sending daily report across month boundary', async () => {
    // Setup: Mock system time to February 28, 23:59:59 UTC
    const februaryLastMoment = new Date('2024-02-28T23:59:59.000Z');
    Date.now = jest.fn(() => februaryLastMoment.getTime());

    const submitInputFebruary: SubmitDailyReportInput = {
      userId: 'eng-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Deploy to staging environment',
      challenges: 'Database connection timeout issues',
      reportDate: '2024-02-28',
    };

    // Execute: Submit daily report at end of February
    const februaryResult: SubmitDailyReportOutput = await submitDailyReport(submitInputFebruary);

    // Verify: February submission result
    expect(februaryResult.reportId).toBeDefined();
    expect(typeof februaryResult.reportId).toBe('string');
    expect(februaryResult.submissionTimestamp).toBe('2024-02-28T23:59:59.000Z');
    expect(februaryResult.isWithinDeadline).toBe(true);

    // Setup: Mock system time to March 1, 00:00:00 UTC (next day, next month)
    const marchFirstMoment = new Date('2024-03-01T00:00:00.000Z');
    Date.now = jest.fn(() => marchFirstMoment.getTime());

    const submitInputMarch: SubmitDailyReportInput = {
      userId: 'eng-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'Deployed API to staging',
      todayPlan: 'Begin production release preparation',
      challenges: 'Performance degradation in staging',
      reportDate: '2024-03-01',
    };

    // Execute: Submit daily report at start of March
    const marchResult: SubmitDailyReportOutput = await submitDailyReport(submitInputMarch);

    // Verify: March submission result
    expect(marchResult.reportId).toBeDefined();
    expect(typeof marchResult.reportId).toBe('string');
    expect(marchResult.submissionTimestamp).toBe('2024-03-01T00:00:00.000Z');
    expect(marchResult.isWithinDeadline).toBe(true);

    // Verify: Both submissions have different report IDs (they are separate reports)
    expect(februaryResult.reportId).not.toBe(marchResult.reportId);

    // Verify: Submission timestamps correctly reflect the month boundary crossing
    expect(new Date(februaryResult.submissionTimestamp).getMonth()).toBe(1); // February (0-indexed)
    expect(new Date(marchResult.submissionTimestamp).getMonth()).toBe(2); // March (0-indexed)
  });
});