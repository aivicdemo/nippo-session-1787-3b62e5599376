import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2478
  test('operationProficiencyScore calculation - throws error when userId is null', () => {
    const input = {
      userId: null as any,
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed feature X',
      todayPlan: 'Start feature Y',
      challenges: 'Database performance issue',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/User ID cannot be null/);
  });
});