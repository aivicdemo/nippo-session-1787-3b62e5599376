import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Prioritization and Colorization', () => {
  // SCEN-897
  test('should assign medium priority flag and yellow color code when priority score is in medium range', () => {
    const mockColorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const mockIssues = [
      {
        issueId: 'issue-001',
        priorityScore: 50,
        keyword: 'database connection timeout',
        impactLevel: 'medium',
      },
    ];

    const mockRequestedBy = 'user-12345';

    const result = prioritizeAndColorizeIssues(
      mockIssues,
      mockColorThresholds,
      mockRequestedBy
    );

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].priorityScore).toBe(50);
    expect(result.colorizedIssues[0].highlightColor).toBe('yellow');
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
  });
});