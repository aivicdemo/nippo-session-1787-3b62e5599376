import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-2958
  test('should highlight issues with priority score 80 or above in red color', () => {
    const redThresholdMin = 80;
    const yellowThresholdMin = 40;

    const highPriorityIssue: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: 85,
      keyword: 'データベース接続エラー',
      impactLevel: 'high',
    };

    const mediumPriorityIssue: IssueSummary = {
      issueId: 'issue-002',
      priorityScore: 50,
      keyword: 'UI調整',
      impactLevel: 'medium',
    };

    const lowPriorityIssue: IssueSummary = {
      issueId: 'issue-003',
      priorityScore: 25,
      keyword: 'ドキュメント更新',
      impactLevel: 'low',
    };

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin,
      yellowThresholdMin,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [highPriorityIssue, mediumPriorityIssue, lowPriorityIssue],
      colorThresholds,
      requestedBy: 'user-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(3);

    const redColoredIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001'
    );
    expect(redColoredIssue).toBeDefined();
    expect(redColoredIssue?.highlightColor).toBe('red');
    expect(redColoredIssue?.shouldHighlight).toBe(true);

    const yellowColoredIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002'
    );
    expect(yellowColoredIssue).toBeDefined();
    expect(yellowColoredIssue?.highlightColor).toBe('yellow');
    expect(yellowColoredIssue?.shouldHighlight).toBe(false);

    const greenColoredIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-003'
    );
    expect(greenColoredIssue).toBeDefined();
    expect(greenColoredIssue?.highlightColor).toBe('green');
    expect(greenColoredIssue?.shouldHighlight).toBe(false);

    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(1);

    expect(result.processedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});