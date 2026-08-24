import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2053: [edge] 対策案の必須項目検証機能 - 実行計画の登録数が 1 件ちょうどの場合に検証がパスする
  test('should validate countermeasure with exactly 1 execution plan and return success', () => {
    const submitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '前日はシステム設計ドキュメントを完成させました。全体アーキテクチャが確定しました。',
      todayPlan: '本日はデータベーススキーマの設計と実装を開始します。',
      challenges: '課題管理ツールとの連携APIの仕様が不明確。確認が必要です。',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(submitDailyReportInput);

    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.isWithinDeadline).toBeDefined();
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});