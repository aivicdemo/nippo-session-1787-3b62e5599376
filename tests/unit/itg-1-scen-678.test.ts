import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-678
  test('should throw TypeError when priorityScore is an object instead of a number', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: { score: 75 } as unknown as number,
          keyword: 'システム障害対応',
          impactLevel: 'high'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-001'
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/優先度スコアは数値型である必要があります/);
  });
});