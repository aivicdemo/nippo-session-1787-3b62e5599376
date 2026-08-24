import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2530: [edge] 初回テスト報告の入力検証機能 - 必須項目のうち 1 つが未入力の場合、検証が不合格となる
  test('submitDailyReport should return validation failure when yesterdayAccomplishment is empty', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '',
      todayPlan: 'Complete feature development',
      challenges: 'Database performance issue',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(expect.stringMatching(/昨日やったこと/));
  });

  test('submitDailyReport should return validation failure when todayPlan is null', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration',
      todayPlan: null as unknown as string,
      challenges: 'Database performance issue',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(expect.stringMatching(/今日やること/));
  });

  test('submitDailyReport should return validation failure when challenges is undefined', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration',
      todayPlan: 'Complete feature development',
      challenges: undefined as unknown as string,
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(expect.stringMatching(/抱えている課題/));
  });
});