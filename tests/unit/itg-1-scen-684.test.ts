import { describe, test, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  IssueSummary,
  ColorThresholdConfig,
  ColorizedIssueList,
  ColorizedIssue,
} from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度色分け機能', () => {
  // SCEN-684: [edge] 課題優先度色分け機能 - 優先度スコア 81 点（赤色閾値直上）で赤色に色分けされる
  test('優先度スコア81の課題が赤色に色分けされる', () => {
    const currentDate = new Date('2024-01-15T10:00:00Z');

    const issue: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: 81,
      keyword: 'デプロイ失敗',
      impactLevel: 'high',
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [issue],
      colorThresholds: {
        redThresholdMin: 80,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(1);

    const colorizedIssue: ColorizedIssue = result.colorizedIssues[0];
    expect(colorizedIssue.issueId).toBe('issue-001');
    expect(colorizedIssue.priorityScore).toBe(81);
    expect(colorizedIssue.keyword).toBe('デプロイ失敗');
    expect(colorizedIssue.impactLevel).toBe('high');
    expect(colorizedIssue.highlightColor).toBe('red');

    expect(result.colorDistribution).toBeDefined();
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);

    expect(result.processedAt).toBeDefined();
    const processedAtTime = new Date(result.processedAt).getTime();
    expect(processedAtTime).toBeGreaterThan(0);
  });
});