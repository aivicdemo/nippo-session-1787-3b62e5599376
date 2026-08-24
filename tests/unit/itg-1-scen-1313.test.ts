import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示する機能', () => {
  // SCEN-1313: [normal] ダッシュボード色分け表示機能 - 1件の課題に対してその優先度に応じた色分け表示が生成される
  test('優先度スコアが高（70以上）の課題に赤色（#FF0000）が適用される', () => {
    // 準備: テストデータとして優先度スコア75（高）の課題を1件用意
    const testIssue: IssueSummary = {
      issueId: 'ISSUE-001',
      priorityScore: 75,
      keyword: 'テスト課題',
      impactLevel: 'high'
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [testIssue],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'manager-user-001'
    };

    // 実行: prioritizeAndColorizeIssues関数を呼び出し
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 検証: 結果が期待通りであることを確認
    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(1);

    const colorizedIssue = result.colorizedIssues[0];
    expect(colorizedIssue.issueId).toBe('ISSUE-001');
    // 優先度スコア75は赤色（高優先度：70以上）に分類される
    expect(colorizedIssue.highlightColor).toBe('red');

    // 色分け結果の統計確認
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);

    // 処理実行日時がISO 8601形式で記録されていることを確認
    expect(result.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});