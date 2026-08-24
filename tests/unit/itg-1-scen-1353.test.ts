import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度スコア色分け表示機能', () => {
  // SCEN-1353: [edge] 優先度スコア色分け表示機能 - 高優先度課題がちょうど閾値（例：70点以上）で赤色に表示される
  test('should colorize issues to red when priorityScore is exactly 70 (threshold boundary)', () => {
    const redThresholdMin = 70;
    const yellowThresholdMin = 40;

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-threshold-exactly-70',
          priorityScore: 70,
          keyword: 'テスト課題A',
          impactLevel: 'high',
        },
        {
          issueId: 'issue-below-threshold-69',
          priorityScore: 69,
          keyword: 'テスト課題B',
          impactLevel: 'medium',
        },
        {
          issueId: 'issue-above-threshold-71',
          priorityScore: 71,
          keyword: 'テスト課題C',
          impactLevel: 'high',
        },
      ],
      colorThresholds: {
        redThresholdMin,
        yellowThresholdMin,
      },
      requestedBy: 'user-dept-lead-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 期待値: スコア70点ちょうどは赤色
    const colorizedIssue70 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-threshold-exactly-70'
    );
    expect(colorizedIssue70).toBeDefined();
    expect(colorizedIssue70?.highlightColor).toBe('red');
    expect(colorizedIssue70?.priorityScore).toBe(70);

    // 期待値: スコア69点は赤色ではない（黄色）
    const colorizedIssue69 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-below-threshold-69'
    );
    expect(colorizedIssue69).toBeDefined();
    expect(colorizedIssue69?.highlightColor).not.toBe('red');
    expect(colorizedIssue69?.highlightColor).toBe('yellow');
    expect(colorizedIssue69?.priorityScore).toBe(69);

    // 期待値: スコア71点は赤色
    const colorizedIssue71 = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-above-threshold-71'
    );
    expect(colorizedIssue71).toBeDefined();
    expect(colorizedIssue71?.highlightColor).toBe('red');
    expect(colorizedIssue71?.priorityScore).toBe(71);

    // 期待値: 色分布は赤2件、黄1件
    expect(result.colorDistribution.red).toBe(2);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(0);

    // 期待値: processedAt は ISO 8601 形式の日時文字列
    expect(result.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});