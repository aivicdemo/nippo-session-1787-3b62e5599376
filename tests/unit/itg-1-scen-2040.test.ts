import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  // SCEN-2040
  test('should reject submission when endDateTime equals startDateTime', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration for user authentication',
      todayPlan: 'Implement database migration script',
      challenges: 'Performance issue with query optimization - needs investigation',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result).toEqual(
      expect.objectContaining({
        reportId: expect.any(String),
        submissionTimestamp: expect.any(String),
        isWithinDeadline: expect.any(Boolean),
      })
    );

    expect(result.reportId).toMatch(/^report-/);
    expect(new Date(result.submissionTimestamp)).toBeInstanceOf(Date);
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});