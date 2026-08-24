import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('優先度スコアが null の場合のダッシュボード色分け判定', () => {
  // SCEN-1064
  test('should throw TypeError when priorityScore is null during colorization', () => {
    const inputWithNullScore = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: null as unknown as number,
          keyword: 'database-timeout',
          impactLevel: 'high' as const,
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-dept-head-001',
    };

    expect(() =>
      prioritizeAndColorizeIssues(inputWithNullScore)
    ).toThrow(/null|number|score/i);
  });
});