import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2640: [error] 初回テスト報告入力検証機能 - 所属チームIDが未指定のとき不合格判定となる
  test('所属チームIDが空文字列のとき、エラーメッセージを返し送信を中止する', () => {
    const input = {
      userId: 'user-001',
      teamId: '',
      yesterdayAccomplishment: 'システムの基本設計を完了した',
      todayPlan: '詳細設計ドキュメントを作成する',
      challenges: 'API仕様の確定が遅れている',
      reportDate: '2024-01-15'
    };

    expect(() => submitDailyReport(input)).toThrow(/チームID/);
  });
});