import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-2155
  test('should rank issues with same priority score by descending frequency', () => {
    const issueA: IssueSummary = {
      issueId: 'issue-a',
      priorityScore: 75,
      keyword: 'Database Performance',
      impactLevel: 'high',
    };

    const issueB: IssueSummary = {
      issueId: 'issue-b',
      priorityScore: 75,
      keyword: 'API Latency',
      impactLevel: 'high',
    };

    const issueC: IssueSummary = {
      issueId: 'issue-c',
      priorityScore: 75,
      keyword: 'Memory Leak',
      impactLevel: 'high',
    };

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [issueA, issueB, issueC],
      colorThresholds,
      requestedBy: 'user-123',
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(3);
    expect(result.colorizedIssues[0].issueId).toBe('issue-b');
    expect(result.colorizedIssues[1].issueId).toBe('issue-a');
    expect(result.colorizedIssues[2].issueId).toBe('issue-c');
    expect(result.colorDistribution.red).toBe(3);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
  });
});