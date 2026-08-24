import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度色分け機能', () => {
  // SCEN-682: [edge] 課題優先度色分け機能 - 優先度スコア 80 点（赤色閾値ちょうど）で赤色に色分けされる
  test('優先度スコア80（赤色閾値ちょうど）の課題は赤色#FF0000に色分けされる', () => {
    const input_issues = [
      {
        issueId: 'issue-001',
        priorityScore: 80,
        keyword: 'database-performance',
        impactLevel: 'high',
      },
    ];

    const input_colorThresholds = {
      redThresholdMin: 80,
      yellowThresholdMin: 40,
    };

    const input_requestedBy = 'user-001';

    const result = prioritizeAndColorizeIssues(
      input_issues,
      input_colorThresholds,
      input_requestedBy
    );

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0]).toEqual({
      issueId: 'issue-001',
      priorityScore: 80,
      keyword: 'database-performance',
      impactLevel: 'high',
      highlightColor: 'red',
    });
    expect(result.colorDistribution).toEqual({
      red: 1,
      yellow: 0,
      green: 0,
    });
    expect(result.processedAt).toBeDefined();
  });
});