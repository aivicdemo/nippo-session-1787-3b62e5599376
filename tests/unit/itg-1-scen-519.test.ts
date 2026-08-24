import { describe, test, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-519
  test('should display issue with priority score 0 without color highlighting', () => {
    const testIssue: IssueSummary = {
      issueId: 'ISSUE-001',
      priorityScore: 0,
      keyword: 'テスト課題',
      impactLevel: 'low',
    };

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [testIssue],
      colorThresholds,
      requestedBy: 'user-123',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    
    const colorizedIssue = result.colorizedIssues[0];
    expect(colorizedIssue.issueId).toBe('ISSUE-001');
    expect(colorizedIssue.priorityScore).toBe(0);
    expect(colorizedIssue.highlightColor).toBe('none');
    expect(colorizedIssue.shouldHighlight).toBe(false);

    expect(result.colorDistribution).toEqual({
      red: 0,
      yellow: 0,
      green: 0,
    });

    expect(typeof result.processedAt).toBe('string');
    expect(new Date(result.processedAt).getTime()).toBeGreaterThan(0);
  });
});