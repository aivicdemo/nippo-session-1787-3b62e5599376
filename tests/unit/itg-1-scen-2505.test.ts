import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2505: [normal] 初回テスト報告の入力検証機能 - 日付形式が不正な場合に修正指示が返される
  test('should return validation error when reportDate format is invalid (YYYY-MM-DD required)', () => {
    const invalidReportDateInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed feature development for login module',
      todayPlan: 'Begin integration testing of authentication system',
      challenges: 'Database connection pooling needs optimization',
      reportDate: '2024-13-45'
    };

    const result = submitDailyReport(invalidReportDateInput);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/報告日付|YYYY-MM-DD/)
      ])
    );
  });
});