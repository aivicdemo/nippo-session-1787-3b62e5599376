import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit Daily Report', () => {
  test('SCEN-073: submitDailyReport returns INVALID_TEAM_ID error when teamId is null', async () => {
    const input = {
      userId: 'user-001',
      teamId: null as unknown as string,
      yesterdayAccomplishment: 'Completed project documentation',
      todayPlan: 'Review pull requests and deploy staging',
      challenges: 'Database migration script needs optimization',
      reportDate: '2024-01-22',
    };

    const result = await submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('INVALID_TEAM_ID');
    expect(result.error?.message).toMatch(/チームIDが指定されていません/);
  });
});