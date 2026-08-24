import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2225
  test('朝会報告の入力値検証機能 - 報告項目にスペースのみ含まれる場合、空文字列扱いで検証に不合格となる', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '   ',
      todayPlan: '　　',
      challenges: 'データベース接続エラーの調査',
      reportDate: '2024-01-15',
    };

    expect(() => {
      submitDailyReport(input);
    }).toThrow(/必須|空でない|入力/);
  });
});