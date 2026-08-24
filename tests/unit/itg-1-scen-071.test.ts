import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Deadline Judgment', () => {
  test('SCEN-071: submitDailyReport returns INVALID_USER_ID error when userId is null', () => {
    const input = {
      userId: null as any,
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed feature development',
      todayPlan: 'Code review and testing',
      challenges: 'Performance optimization needed',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/INVALID_USER_ID/);
  });
});