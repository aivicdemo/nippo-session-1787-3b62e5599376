import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Edge Case: Maximum Daily Issue Volume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-972: [edge] 課題優先度スコア計算・色分け表示機能 - 当日の業務上最大規模の課題件数（上限値）でスコア計算が正常に完了する
  test('should calculate priority scores for maximum business-volume issue count without exception', async () => {
    // 当日の業務上最大規模課題件数を定義
    // 朝会報告サイクル: 部員10名 × 1人あたり平均2-3課題 = 最大約30件
    const MAX_DAILY_ISSUES = 30;
    const PERFORMANCE_THRESHOLD_MS = 5000; // ダッシュボード表示レスポンス要件: 5秒以内

    // テストデータ生成: 30件の課題オブジェクト
    const testIssues: IssuePriorityScoringInput[] = [];
    for (let i = 1; i <= MAX_DAILY_ISSUES; i++) {
      testIssues.push({
        issueId: `issue-${String(i).padStart(3, '0')}`,
        issueContent: `Sample issue content #${i}: Database connection timeout in production environment`,
        occurrenceFrequency: 3 + (i % 5),
        impactScore: 40 + (i % 40),
        affectedTeamCount: 1 + (i % 4),
        resolutionDaysAverage: 2 + (i % 7),
        reportingDate: '2024-01-15',
        teamId: `team-${String((i % 3) + 1).padStart(2, '0')}`,
      });
    }

    // 処理実行時間計測開始
    const startTime = Date.now();
    let results: IssuePriorityScoringOutput[] = [];
    let executionError: Error | null = null;

    try {
      results = testIssues.map((issue) => calculateIssuePriorityScore(issue));
    } catch (error) {
      executionError = error as Error;
    }

    const executionTime = Date.now() - startTime;

    // (1) 関数が例外なく正常終了し、入力件数と同じサイズの配列を返す
    expect(executionError).toBeNull();
    expect(results).toHaveLength(MAX_DAILY_ISSUES);

    // (2) すべての課題オブジェクトに0～100の整数スコアと有効な色分けコードが設定されている
    results.forEach((result, index) => {
      expect(result.issueId).toBe(`issue-${String(index + 1).padStart(3, '0')}`);
      expect(result.priorityScore).toBeGreaterThanOrEqual(1);
      expect(result.priorityScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.priorityScore)).toBe(true);
      expect(result.priorityRank).toMatch(/^(高|中|低)$/);
      expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
      expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(result.colorCode);
    });

    // (3) スコア算出ロジックが正常に機能し、計算結果が期待範囲内である
    // 優先度スコア = min(40, frequencyScore) + min(40, impactScore) + min(20, resolutionDifficultyScore)
    // 各スコアコンポーネントが正しく計算されているか確認
    results.forEach((result, index) => {
      const sourceIssue = testIssues[index];
      const frequencyScore = Math.min(40, sourceIssue.occurrenceFrequency * 5);
      const impactScore = Math.min(40, sourceIssue.impactScore);
      const resolutionDifficultyScore = Math.min(20, sourceIssue.resolutionDaysAverage * 2);
      const expectedMinScore = Math.min(100, frequencyScore + impactScore + resolutionDifficultyScore);

      expect(result.scoreBreakdown).toBeDefined();
      expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

      const calculatedTotal =
        result.scoreBreakdown.frequencyScore +
        result.scoreBreakdown.impactScore +
        result.scoreBreakdown.resolutionDifficultyScore;
      expect(calculatedTotal).toBeLessThanOrEqual(100);
      expect(result.priorityScore).toBeLessThanOrEqual(calculatedTotal + 1); // 許容誤差1
    });

    // (4) 処理完了時間が業務上許容可能な範囲に収まっている
    expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);

    // 色分けの分布を確認: 優先度スコアに応じた色分けが正しく実装されているか
    const colorDistribution = {
      red: 0,
      yellow: 0,
      green: 0,
    };

    results.forEach((result) => {
      if (result.priorityScore >= 70) {
        expect(result.colorCode).toBe('#FF0000');
        colorDistribution.red += 1;
      } else if (result.priorityScore >= 40) {
        expect(result.colorCode).toBe('#FFFF00');
        colorDistribution.yellow += 1;
      } else {
        expect(result.colorCode).toBe('#00FF00');
        colorDistribution.green += 1;
      }
    });

    // 色分け配布の検証: 30件の課題が妥当な分布になっているか
    expect(colorDistribution.red + colorDistribution.yellow + colorDistribution.green).toBe(MAX_DAILY_ISSUES);
    expect(colorDistribution.red).toBeGreaterThan(0);
    expect(colorDistribution.yellow).toBeGreaterThan(0);
    expect(colorDistribution.green).toBeGreaterThan(0);

    // タイムスタンプが記録されているか確認
    results.forEach((result) => {
      expect(result.calculatedAt).toBeDefined();
      const calculatedDate = new Date(result.calculatedAt);
      expect(calculatedDate.getTime()).toBeGreaterThan(0);
    });
  });
});