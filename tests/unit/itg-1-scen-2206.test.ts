import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2206
  test('朝会報告の入力検証機能 - 抱えている課題が空文字列のとき入力エラーが返される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'ドキュメント作成',
      todayPlan: 'レビュー実施',
      challenges: '',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/抱えている課題/);
  });
});