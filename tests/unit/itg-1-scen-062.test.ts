import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Timestamp Recording', () => {
  // SCEN-062
  test('should record server timestamp with millisecond precision when engineer submits daily report', async () => {
    const mockTimestamp = new Date('2026-08-19T10:30:45.123Z');
    const reportId = 'report-20260819-001';
    const userId = 'engineer-user-123';
    const teamId = 'team-dev-001';
    const reportDate = '2026-08-19';

    const input = {
      userId,
      teamId,
      yesterdayAccomplishment: 'Completed API integration tests for user authentication module.',
      todayPlan: 'Review pull requests and implement database migration scripts.',
      challenges: 'Performance bottleneck in data synchronization service needs optimization.',
      reportDate,
    };

    const mockDatabase = {
      saveReport: jest.fn().mockResolvedValue({
        reportId,
        userId,
        teamId,
        reportDate,
        yesterdayAccomplishment: input.yesterdayAccomplishment,
        todayPlan: input.todayPlan,
        challenges: input.challenges,
        submissionTimestamp: mockTimestamp.toISOString(),
        isWithinDeadline: true,
      }),
    };

    jest.useFakeTimers();
    jest.setSystemTime(mockTimestamp);

    const result = await submitDailyReport(input, {
      database: mockDatabase,
      getCurrentTimestamp: () => mockTimestamp,
    });

    jest.useRealTimers();

    expect(result).toBeDefined();
    expect(result.reportId).toBe(reportId);
    expect(result.submissionTimestamp).toBe('2026-08-19T10:30:45.123Z');
    expect(result.isWithinDeadline).toBe(true);

    const savedReport = mockDatabase.saveReport.mock.results[0].value;
    expect(savedReport.submissionTimestamp).toBe('2026-08-19T10:30:45.123Z');
  });
});