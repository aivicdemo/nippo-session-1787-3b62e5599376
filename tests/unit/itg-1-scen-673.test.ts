import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction Prioritization - Color Threshold Validation', () => {
  test('SCEN-673: should throw validation error when yellow threshold is null', () => {
    const input = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: 'データベース遅延',
          impactLevel: 'high' as const,
        },
        {
          issueId: 'issue-002',
          priorityScore: 55,
          keyword: 'テスト環境不足',
          impactLevel: 'medium' as const,
        },
        {
          issueId: 'issue-003',
          priorityScore: 25,
          keyword: 'ドキュメント更新',
          impactLevel: 'low' as const,
        },
      ],
      colorThresholds: {
        redThresholdMin: 80,
        yellowThresholdMin: null as unknown as number,
      },
      requestedBy: 'user-dept-head-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/黄色/);
  });
});