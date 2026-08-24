import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('優先度スコアに基づく課題の色分け表示機能', () => {
  // SCEN-652: [normal] 課題優先度色分け表示機能 - 優先度スコア80以上の課題が赤色で表示される
  test('優先度スコア80以上の課題が赤色（#FF0000）でハイライト表示される', () => {
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: '本番システムダウン対応',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 75,
        keyword: 'ドキュメント整備',
        impactLevel: 'low',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 80,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'user-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    const redColoredIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001'
    );
    expect(redColoredIssue).toBeDefined();
    expect(redColoredIssue?.highlightColor).toBe('red');
    expect(redColoredIssue?.priorityScore).toBe(85);

    const nonRedIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002'
    );
    expect(nonRedIssue).toBeDefined();
    expect(nonRedIssue?.highlightColor).not.toBe('red');
    expect(nonRedIssue?.priorityScore).toBe(75);

    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(1);

    expect(result.processedAt).toBeDefined();
    expect(new Date(result.processedAt)).toBeInstanceOf(Date);
  });
});