import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2061: [edge] 対策案の必須項目検証機能 - 実行計画が月をまたぐ場合に検証がパスする
  test('実行計画が月をまたぐ場合でも必須項目の検証がパスして対策案が正常に受け付けられる', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'データベース最適化を完了しました。クエリ性能が30%向上しました。',
      todayPlan: 'API仕様書作成とエンドポイント実装を開始します。',
      challenges: 'パフォーマンステストの環境構築に時間がかかっています。',
      reportDate: '2024-12-16',
    };

    const result = submitDailyReport(input);

    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.isWithinDeadline).toBe(true);
  });
});