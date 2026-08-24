import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('ダッシュボード色分け表示機能 - 課題の優先度別色分け判定', () => {
  // SCEN-1609
  test('優先度スコア50（中程度）の課題を通常表示対象として判定し、強調表示フラグがfalseで返される', () => {
    const input = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 50,
          keyword: 'テスト自動化の遅延',
          impactLevel: 'medium' as const,
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-123',
    };

    const result = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0]).toEqual({
      issueId: 'issue-001',
      priorityScore: 50,
      keyword: 'テスト自動化の遅延',
      impactLevel: 'medium',
      shouldHighlight: false,
      highlightColor: 'yellow',
    });
    expect(result.colorDistribution).toEqual({
      red: 0,
      yellow: 1,
      green: 0,
    });
    expect(typeof result.processedAt).toBe('string');
  });
});