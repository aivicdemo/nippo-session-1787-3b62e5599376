import { describe, test, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-654: [normal] 課題優先度色分け表示機能 - 優先度スコア50未満の課題が緑色で表示される
  test('should display issue with priority score below 50 in green color', () => {
    // Arrange
    const testIssues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 45,
        keyword: 'デプロイエラー',
        impactLevel: 'low',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: testIssues,
      colorThresholds: colorThresholds,
      requestedBy: 'user-manager-001',
    };

    // Act
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(1);

    const colorizedIssue = result.colorizedIssues[0];
    expect(colorizedIssue.issueId).toBe('issue-001');
    expect(colorizedIssue.highlightColor).toBe('green');

    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(1);

    expect(result.processedAt).toBeDefined();
    const processedAtDate = new Date(result.processedAt);
    expect(processedAtDate.getTime()).toBeGreaterThan(0);
  });
});