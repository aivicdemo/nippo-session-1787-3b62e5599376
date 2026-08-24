import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2522: [error] 初回テスト報告の入力検証 - テスト実施内容の文字数が上限を超えるとき入力検証エラーが返される
  test('should return validation error when challenges field exceeds 500 character limit', () => {
    const exceedingText = 'a'.repeat(501);

    const input = {
      userId: 'test-user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Continue unit test implementation',
      challenges: exceedingText,
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/文字数制限/);
  });
});