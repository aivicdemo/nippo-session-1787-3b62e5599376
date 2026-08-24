import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('ダッシュボード色分け表示機能', () => {
  // SCEN-1610
  test('優先度スコアが低い課題を通常表示対象として判定し、強調表示フラグが false で返される', () => {
    const issues = [
      {
        issueId: 'issue-001',
        priorityScore: 25,
        keyword: 'テストデータ',
        impactLevel: 'low',
      },
    ];

    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const result = prioritizeAndColorizeIssues(
      issues,
      colorThresholds,
      'user-123'
    );

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].shouldHighlight).toBe(false);
    expect(result.colorizedIssues[0].highlightColor).toBe('green');
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(1);
  });
});