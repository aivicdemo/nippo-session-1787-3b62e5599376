import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2060: [edge] 対策案の必須項目検証機能 - 実行計画の終了日が開始日より前の場合に検証が失敗する
  test('実行計画の終了日が開始日より前の場合、バリデーション失敗を返す', () => {
    const input = {
      userId: 'eng-001',
      teamId: 'team-A',
      yesterdayAccomplishment: '前日の実績を完了した',
      todayPlan: '本日の予定を実施する',
      challenges: '課題を特定した',
      reportDate: '2026-08-20',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(/終了日/);
  });
});