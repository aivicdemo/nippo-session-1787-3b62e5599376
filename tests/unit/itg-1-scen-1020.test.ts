import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue prioritization and colorization for dashboard display', () => {
  test('SCEN-1020: Medium priority issue should be displayed with yellow color on dashboard', () => {
    const input = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 55,
          keyword: 'システム障害対応',
          impactLevel: 'medium',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'manager-user-001',
    };

    const result = prioritizeAndColorizeIssues(input);

    expect(result).toEqual({
      colorizedIssues: [
        {
          issueId: 'issue-001',
          priorityScore: 55,
          keyword: 'システム障害対応',
          impactLevel: 'medium',
          highlightColor: 'yellow',
        },
      ],
      colorDistribution: {
        red: 0,
        yellow: 1,
        green: 0,
      },
      processedAt: expect.any(String),
    });

    expect(result.colorizedIssues[0].highlightColor).toBe('yellow');
    expect(result.colorDistribution.yellow).toBe(1);
  });
});