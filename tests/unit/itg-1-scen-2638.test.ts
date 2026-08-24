import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2638
  test('[error] 初回テスト報告入力検証機能 - 報告日時が未入力のとき不合格判定となる', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: 'リソース不足',
      reportDate: '',
    };

    expect(() => submitDailyReport(input)).toThrow(/報告日時/);
  });
});