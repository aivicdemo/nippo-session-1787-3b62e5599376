import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - Issue Priority Color Coding', () => {
  // SCEN-663
  test('should throw validation error when priorityScore exceeds 100', () => {
    const input = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 101,
          keyword: 'database_connection_timeout',
          impactLevel: 'high' as const
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-12345'
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/優先度スコア/);
  });
});