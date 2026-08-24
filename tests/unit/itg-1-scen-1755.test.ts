import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Prioritization and Colorization - Dashboard Display', () => {
  test('SCEN-1755: When priority score is 79 (below high threshold of 80), issue should be colored with medium color', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 79,
          keyword: 'database_performance',
          impactLevel: 'medium',
        },
      ],
      colorThresholds: {
        redThresholdMin: 80,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-manager-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].priorityScore).toBe(79);
    expect(result.colorizedIssues[0].highlightColor).toBe('yellow');
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(0);
    expect(typeof result.processedAt).toBe('string');
  });
});