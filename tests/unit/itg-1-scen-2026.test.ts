import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  // SCEN-2026
  test('should return validation error when countermeasure title is empty string', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Fixed critical bug in payment module',
      todayPlan: 'Implement new feature for user dashboard',
      challenges: 'Database migration is taking longer than expected',
      reportDate: '2024-01-15',
      countermeasures: [
        {
          title: '',
          description: 'Allocate additional resources to accelerate migration',
          priority: 'high',
          owner: 'user-002',
          targetDate: '2024-01-17'
        }
      ]
    };

    expect(() => submitDailyReport(input)).toThrow(/タイトルは必須項目です/);
  });
});