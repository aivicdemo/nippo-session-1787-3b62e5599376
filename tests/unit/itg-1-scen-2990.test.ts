import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-2990
  test('should throw TypeError when issues array is null', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: null as any,
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/null/);
  });
});