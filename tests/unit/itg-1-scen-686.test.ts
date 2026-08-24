import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア色分け表示機能', () => {
  // SCEN-686: [edge] 課題優先度色分け機能 - 優先度スコア 49 点（黄色閾値直下）で緑色に色分けされる
  test('優先度スコア49点の課題が緑色で表示される', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 49,
          keyword: 'テストデータ',
          impactLevel: 'low',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 50,
      },
      requestedBy: 'user-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].highlightColor).toBe('green');
    expect(result.colorDistribution.green).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.processedAt).toBeDefined();
  });
});