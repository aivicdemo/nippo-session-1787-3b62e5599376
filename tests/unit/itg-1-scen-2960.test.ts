import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('優先度スコアに基づいた課題の色分け・ハイライト表示機能', () => {
  // SCEN-2960
  test('優先度スコア50未満の課題は通常表示される', () => {
    // Arrange
    const testIssues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 45,
        keyword: 'データベース遅延',
        impactLevel: 'medium',
      },
    ];

    const testColorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 50,
    };

    const testInput: PrioritizeAndColorizeIssuesInput = {
      issues: testIssues,
      colorThresholds: testColorThresholds,
      requestedBy: 'user-001',
    };

    // Act
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(testInput);

    // Assert
    expect(result.colorizedIssues).toHaveLength(1);
    const colorizedIssue = result.colorizedIssues[0];
    expect(colorizedIssue.issueId).toBe('issue-001');
    expect(colorizedIssue.highlightColor).toBe('green');
    expect(colorizedIssue.priorityScore).toBe(45);
    expect(result.colorDistribution).toEqual({
      red: 0,
      yellow: 0,
      green: 1,
    });
    expect(result.processedAt).toBeTruthy();
  });
});