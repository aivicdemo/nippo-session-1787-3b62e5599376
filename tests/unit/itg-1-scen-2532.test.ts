import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit Daily Report', () => {
  test('SCEN-2532: [edge] Initial test report input validation - future date rejection', () => {
    // Arrange: Setup test data with a future date (tomorrow)
    const todayIsoString = '2026-08-20';
    const tomorrowIsoString = '2026-08-21';
    
    const futureReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed database schema design and implementation',
      todayPlan: 'Review pull requests and conduct code review meeting',
      challenges: 'Performance optimization for batch processing job',
      reportDate: tomorrowIsoString,
    };

    // Act & Assert: Verify that submitDailyReport rejects future dates
    expect(() => submitDailyReport(futureReportInput)).toThrow(/報告日時/);
  });
});