import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Highlighting - Priority Score Validation', () => {
  // SCEN-706
  test('should throw error when issue has undefined priority score', () => {
    const input = {
      issues: [
        {
          issueId: 'ISSUE-001',
          priorityScore: null,
          keyword: '抱えている課題テスト',
          impactLevel: 'high' as const,
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/優先度スコア/);
  });
});