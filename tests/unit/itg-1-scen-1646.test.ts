import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-1646
  test('should return COLOR_HIGHLIGHT_DEFINITION_NOT_FOUND error when color threshold config is empty', () => {
    const input = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 75,
          keyword: 'デプロイ失敗',
          impactLevel: 'high' as const,
        },
        {
          issueId: 'issue-002',
          priorityScore: 45,
          keyword: 'テストカバレッジ低下',
          impactLevel: 'medium' as const,
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(
      /COLOR_HIGHLIGHT_DEFINITION_NOT_FOUND/
    );
  });
});