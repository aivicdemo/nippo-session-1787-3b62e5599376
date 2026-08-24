import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-676
  test('should throw validation error when redThresholdMin is less than yellowThresholdMin', () => {
    const input = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 75,
          keyword: 'database connection timeout',
          impactLevel: 'high' as const,
        },
        {
          issueId: 'issue-002',
          priorityScore: 45,
          keyword: 'memory leak in batch process',
          impactLevel: 'medium' as const,
        },
      ],
      colorThresholds: {
        redThresholdMin: 30,
        yellowThresholdMin: 50,
      },
      requestedBy: 'user-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/赤色のしきい値/);
  });
});