import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Colorize Issues for Dashboard', () => {
  test('SCEN-471: priority score 0 should not apply highlight colors', () => {
    // Arrange
    const issuesWithMinimumScore: Array<{
      issueId: string;
      priorityScore: number;
      keyword: string;
      impactLevel: string;
    }> = [
      {
        issueId: 'issue-001',
        priorityScore: 0,
        keyword: 'test-keyword',
        impactLevel: 'low',
      },
    ];

    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = 'user-12345';

    // Act
    const result = prioritizeAndColorizeIssues(
      {
        issues: issuesWithMinimumScore,
        colorThresholds: colorThresholds,
        requestedBy: requestedBy,
      }
    );

    // Assert
    expect(result.colorizedIssues).toHaveLength(1);
    const colorizedIssue = result.colorizedIssues[0];
    
    expect(colorizedIssue.issueId).toBe('issue-001');
    expect(colorizedIssue.priorityScore).toBe(0);
    expect(colorizedIssue.highlightColor).toBe('none');
    
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
    
    expect(result.processedAt).toBeDefined();
    const processedAtDate = new Date(result.processedAt);
    expect(processedAtDate.getTime()).toBeGreaterThan(0);
  });
});