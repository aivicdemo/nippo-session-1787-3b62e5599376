import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別色分け表示機能', () => {
  // SCEN-1019: [normal] 優先度別色分け表示機能 - 優先度の高い課題が部長向けダッシュボードで色分けされて表示される
  test('should colorize issues by priority score and return color-coded issue list for director dashboard', () => {
    const issueSummaries: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'システム障害',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 55,
        keyword: 'ドキュメント作成',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-003',
        priorityScore: 25,
        keyword: '軽微なバグ',
        impactLevel: 'low',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issueSummaries,
      colorThresholds: colorThresholds,
      requestedBy: 'director-user-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(3);

    const issue001 = result.colorizedIssues.find((issue) => issue.issueId === 'issue-001');
    expect(issue001).toBeDefined();
    expect(issue001?.highlightColor).toBe('red');
    expect(issue001?.keyword).toBe('システム障害');

    const issue002 = result.colorizedIssues.find((issue) => issue.issueId === 'issue-002');
    expect(issue002).toBeDefined();
    expect(issue002?.highlightColor).toBe('yellow');
    expect(issue002?.keyword).toBe('ドキュメント作成');

    const issue003 = result.colorizedIssues.find((issue) => issue.issueId === 'issue-003');
    expect(issue003).toBeDefined();
    expect(issue003?.highlightColor).toBe('green');
    expect(issue003?.keyword).toBe('軽微なバグ');

    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(1);

    expect(result.processedAt).toBeDefined();
    expect(typeof result.processedAt).toBe('string');
  });
});