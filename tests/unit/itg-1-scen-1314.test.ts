import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-1314
  test('should apply color coding to issues based on priority scores and color thresholds', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: 'Database connection timeout',
          impactLevel: 'high',
        },
        {
          issueId: 'issue-002',
          priorityScore: 55,
          keyword: 'API response delay',
          impactLevel: 'medium',
        },
        {
          issueId: 'issue-003',
          priorityScore: 25,
          keyword: 'Minor UI bug',
          impactLevel: 'low',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'manager-user-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(3);

    const highPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001'
    );
    expect(highPriorityIssue).toBeDefined();
    expect(highPriorityIssue?.highlightColor).toBe('red');
    expect(highPriorityIssue?.priorityScore).toBe(85);

    const mediumPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002'
    );
    expect(mediumPriorityIssue).toBeDefined();
    expect(mediumPriorityIssue?.highlightColor).toBe('yellow');
    expect(mediumPriorityIssue?.priorityScore).toBe(55);

    const lowPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-003'
    );
    expect(lowPriorityIssue).toBeDefined();
    expect(lowPriorityIssue?.highlightColor).toBe('green');
    expect(lowPriorityIssue?.priorityScore).toBe(25);

    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(1);

    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});