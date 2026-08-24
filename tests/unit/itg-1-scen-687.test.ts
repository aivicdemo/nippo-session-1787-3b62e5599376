import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-687: [edge] 課題優先度色分け機能 - 優先度スコア 51 点（黄色閾値直上）で黄色に色分けされる
  test('should colorize issue with priority score 51 as yellow when yellow threshold is 51', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 51,
          keyword: 'システム障害',
          impactLevel: 'medium',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 51,
      },
      requestedBy: 'user-manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].priorityScore).toBe(51);
    expect(result.colorizedIssues[0].highlightColor).toBe('yellow');
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
    expect(typeof result.processedAt).toBe('string');
  });
});