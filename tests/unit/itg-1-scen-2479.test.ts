import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  test('SCEN-2479: should throw error when userId is undefined', async () => {
    const input: Partial<SubmitDailyReportInput> = {
      userId: undefined,
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed feature implementation',
      todayPlan: 'Review and testing',
      challenges: 'Database performance issue',
      reportDate: '2024-01-15',
    };

    expect(() =>
      submitDailyReport(input as SubmitDailyReportInput)
    ).toThrow(/User ID/);
  });
});