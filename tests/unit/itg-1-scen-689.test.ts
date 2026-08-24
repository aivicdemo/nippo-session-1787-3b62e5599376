import { describe, it, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PriorityAndColorizeIssuesInput, IssueSummary, ColorThresholdConfig, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Color Categorization', () => {
  // SCEN-689: [edge] 課題優先度色分け機能 - 優先度スコア 0 点（最小値）で緑色に色分けされる
  it('should colorize issue with priority score 0 as green', () => {
    const testIssueWithMinScore: IssueSummary = {
      issueId: 'ISSUE-001',
      priorityScore: 0,
      keyword: 'minimum-priority-test',
      impactLevel: 'low',
    };

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PriorityAndColorizeIssuesInput = {
      issues: [testIssueWithMinScore],
      colorThresholds: colorThresholds,
      requestedBy: 'test-user-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('ISSUE-001');
    expect(result.colorizedIssues[0].priorityScore).toBe(0);
    expect(result.colorizedIssues[0].highlightColor).toBe('green');
    expect(result.colorDistribution.green).toBe(1);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);
  });
});