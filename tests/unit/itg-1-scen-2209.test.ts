import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2209
  test('朝会報告の入力検証機能 - 今日やることが必須文字数下限を下回るとき入力エラーが返される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'テスト実装を完了しました',
      todayPlan: 'a',
      challenges: '環境構築に時間がかかっています',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/今日やること/);
  });
});