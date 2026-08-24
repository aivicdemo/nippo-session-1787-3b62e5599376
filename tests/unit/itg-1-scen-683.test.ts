import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度色分け機能', () => {
  test('SCEN-683: 優先度スコア 79 点（赤色閾値直下）で黄色に色分けされる', () => {
    const input = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 79,
          keyword: 'データベース接続エラー',
          impactLevel: 'medium',
        },
      ],
      colorThresholds: {
        redThresholdMin: 80,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    const result = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0]).toEqual({
      issueId: 'issue-001',
      priorityScore: 79,
      keyword: 'データベース接続エラー',
      impactLevel: 'medium',
      highlightColor: 'yellow',
    });
    expect(result.colorDistribution).toEqual({
      red: 0,
      yellow: 1,
      green: 0,
    });
    expect(result.processedAt).toBeDefined();
  });
});