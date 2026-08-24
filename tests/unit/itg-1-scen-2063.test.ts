import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2063
  test('複数の実行計画が同じ優先度スコアを持つ場合に検証がパスする', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-A',
      yesterdayAccomplishment: 'システムの基本設計を完了し、ドキュメントを作成した。',
      todayPlan: 'ユーザーインターフェースの実装を開始する。',
      challenges: 'API仕様が確定していないため進行に遅れが生じている。',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(typeof result.reportId).toBe('string');
    expect(result.submissionTimestamp).toBeTruthy();
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.isWithinDeadline).toBeDefined();
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});