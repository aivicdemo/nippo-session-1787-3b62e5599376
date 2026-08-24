import { describe, it, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - Low Priority Issue Suppression Color Classification', () => {
  let mockColorThresholds: any;

  beforeEach(() => {
    mockColorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };
  });

  it('SCEN-1133: Low priority issue should be classified with suppression color', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-low-001',
          priorityScore: 25,
          keyword: '軽微なUI改善',
          impactLevel: 'low',
        },
      ],
      colorThresholds: mockColorThresholds,
      requestedBy: 'user-dept-head-001',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-low-001');
    expect(result.colorizedIssues[0].highlightColor).toBe('green');
    expect(result.colorDistribution.green).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.processedAt).toBeDefined();
  });
});