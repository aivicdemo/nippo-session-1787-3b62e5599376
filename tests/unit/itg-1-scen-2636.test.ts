import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  test('SCEN-2636: 初回テスト報告入力検証機能 - 報告内容のテキストが空文字列のとき不合格判定となる', () => {
    const input = {
      userId: 'test-user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '',
      todayPlan: 'sample plan',
      challenges: 'sample challenge',
      reportDate: '2024-01-15',
    };

    expect(() => {
      submitDailyReport(input);
    }).toThrow(/報告内容/);
  });
});