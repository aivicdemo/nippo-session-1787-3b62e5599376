import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Colorize Issues', () => {
  test('SCEN-700: Issues with frequency above threshold and impact score meeting criteria are color-coded appropriately', () => {
    const issues: Array<{
      issueId: string;
      priorityScore: number;
      keyword: string;
      impactLevel: string;
    }> = [
      {
        issueId: 'issue-001',
        priorityScore: 75,
        keyword: 'データベース接続エラー',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 55,
        keyword: 'API応答遅延',
        impactLevel: 'medium',
      },
    ];

    const colorThresholds = {
      redThresholdMin: 60,
      yellowThresholdMin: 40,
    };

    const result = prioritizeAndColorizeIssues(issues, colorThresholds, 'user-123');

    expect(result.colorizedIssues).toHaveLength(2);

    const databaseErrorIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001'
    );
    expect(databaseErrorIssue).toBeDefined();
    expect(databaseErrorIssue?.highlightColor).toBe('red');

    const apiDelayIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002'
    );
    expect(apiDelayIssue).toBeDefined();
    expect(apiDelayIssue?.highlightColor).not.toBe('red');

    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(0);

    expect(result.processedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });
});