import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  // SCEN-2516
  test('should return validation error when challenge flag is true but challenge content is empty', () => {
    const input = {
      userId: 'test-user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Deploy to staging environment',
      challenges: '',
      reportDate: '2024-01-15',
      hasChallengeFlag: true,
    };

    expect(() => submitDailyReport(input)).toThrow(/課題内容/);
  });
});