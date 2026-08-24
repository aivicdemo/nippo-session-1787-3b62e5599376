import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submission with Deadline Parity', () => {
  test('SCEN-264: Report submitted at exact deadline time is marked as on-time', () => {
    // Arrange
    const now = new Date('2026-08-20T09:00:00.000Z');
    const reportDeadline = new Date('2026-08-20T09:00:00.000Z');
    
    const input = {
      userId: 'eng-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'Completed database optimization task for user authentication module.',
      todayPlan: 'Begin integration testing of payment gateway system.',
      challenges: 'Authentication API endpoint shows intermittent timeout under load.',
      reportDate: '2026-08-20',
      submissionTimestamp: now,
      reportDeadline: reportDeadline,
    };

    // Act
    const result = submitDailyReport(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(typeof result.reportId).toBe('string');
    expect(result.submissionTimestamp).toEqual(now.toISOString());
    expect(result.isWithinDeadline).toBe(true);
    expect(result.deadlineComparisonResult?.status).toBe('on_time');
    expect(result.deadlineComparisonResult?.minutesBeforeDeadline).toBe(0);
  });
});