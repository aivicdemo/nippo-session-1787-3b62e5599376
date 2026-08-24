import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2210: [error] 朝会報告の入力検証機能 - 抱えている課題が必須文字数下限を下回るとき入力エラーが返される
  test('抱えている課題が1文字のみの場合、入力検証エラーが返される', () => {
    const submitInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'データベース設計書を作成した',
      todayPlan: 'APIエンドポイントの実装を進める',
      challenges: 'a',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(submitInput)).toThrow(/抱えている課題/);
  });
});