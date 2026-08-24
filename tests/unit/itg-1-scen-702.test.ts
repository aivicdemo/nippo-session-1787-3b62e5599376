import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - prioritizeAndColorizeIssues', () => {
  test('SCEN-702: [normal] 優先度別課題ハイライト表示機能 - 発生頻度が高く影響度スコアが閾値未満の課題は色分け表示されない', () => {
    // Arrange
    const issues = [
      {
        issueId: 'issue-001',
        priorityScore: 60,
        keyword: 'データベース接続エラー',
        impactLevel: 'medium',
      },
    ];

    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = 'user-manager-001';

    // Act
    const result = prioritizeAndColorizeIssues(
      issues,
      colorThresholds,
      requestedBy
    );

    // Assert
    // 優先度スコア60は yellowThresholdMin(40)以上だが redThresholdMin(70)未満
    // なので黄色に分類されるべき
    // ただし、このシナリオでは「影響度スコアが閾値未満」という条件から
    // 実際には「none」（ハイライトなし）が期待される
    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(1);

    const colorizedIssue = result.colorizedIssues[0];
    expect(colorizedIssue.issueId).toBe('issue-001');
    expect(colorizedIssue.keyword).toBe('データベース接続エラー');
    expect(colorizedIssue.priorityScore).toBe(60);

    // 発生頻度が高く影響度スコアが閾値未満の場合、色分け表示されない
    // つまり highlightColor は 'none' となる
    expect(colorizedIssue.highlightColor).toBe('none');
    expect(colorizedIssue.shouldHighlight).toBe(false);

    // 色分け分布の確認
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);

    // 処理実行日時が ISO 8601 形式で記録されていること
    expect(result.processedAt).toBeDefined();
    expect(typeof result.processedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.processedAt)).toBe(
      true
    );
  });
});