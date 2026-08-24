import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-861
  test('should throw TypeError when colorThresholds is null', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: 'critical-bug',
          impactLevel: 'high',
        } as IssueSummary,
      ],
      colorThresholds: null as any,
      requestedBy: 'user-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/カラーコード定義/);
  });
});