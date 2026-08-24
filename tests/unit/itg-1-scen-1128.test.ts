import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type IssueSummary, type ColorThresholdConfig, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue prioritization and colorization - dashboard display', () => {
  // SCEN-1128
  test('should display confirmed issues sorted by priority score in descending order', () => {
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-a',
        priorityScore: 85,
        keyword: 'Database connection timeout',
        impactLevel: 'high'
      },
      {
        issueId: 'issue-b',
        priorityScore: 60,
        keyword: 'UI rendering delay',
        impactLevel: 'medium'
      },
      {
        issueId: 'issue-c',
        priorityScore: 92,
        keyword: 'Critical API failure',
        impactLevel: 'high'
      },
      {
        issueId: 'issue-d',
        priorityScore: 45,
        keyword: 'Minor documentation update needed',
        impactLevel: 'low'
      }
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40
    };

    const requestedBy = 'user-manager-001';

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(
      issues,
      colorThresholds,
      requestedBy
    );

    expect(result.colorizedIssues).toHaveLength(4);
    expect(result.colorizedIssues[0].issueId).toBe('issue-c');
    expect(result.colorizedIssues[0].priorityScore).toBe(92);
    expect(result.colorizedIssues[1].issueId).toBe('issue-a');
    expect(result.colorizedIssues[1].priorityScore).toBe(85);
    expect(result.colorizedIssues[2].issueId).toBe('issue-b');
    expect(result.colorizedIssues[2].priorityScore).toBe(60);
    expect(result.colorizedIssues[3].issueId).toBe('issue-d');
    expect(result.colorizedIssues[3].priorityScore).toBe(45);

    expect(result.colorDistribution.red).toBe(2);
    expect(result.colorDistribution.yellow).toBe(2);
    expect(result.colorDistribution.green).toBe(0);

    expect(result.colorizedIssues[0].highlightColor).toBe('red');
    expect(result.colorizedIssues[1].highlightColor).toBe('red');
    expect(result.colorizedIssues[2].highlightColor).toBe('yellow');
    expect(result.colorizedIssues[3].highlightColor).toBe('yellow');

    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate instanceof Date && !isNaN(processedDate.getTime())).toBe(true);
  });
});