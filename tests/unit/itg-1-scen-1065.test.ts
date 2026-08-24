import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-1065
  test('should throw error when requestedBy user does not have director role', () => {
    const input = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: 'データベース接続エラー',
          impactLevel: 'high' as const,
        },
        {
          issueId: 'issue-002',
          priorityScore: 45,
          keyword: 'ドキュメント更新必要',
          impactLevel: 'medium' as const,
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-non-director',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/権限/);
  });
});