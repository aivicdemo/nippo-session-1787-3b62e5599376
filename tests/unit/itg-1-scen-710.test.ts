import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-710
  test('優先度閾値が null のとき処理がエラーになる', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
          keyword: 'システム障害',
          impactLevel: 'high',
        },
      ],
      colorThresholds: {
        redThresholdMin: null as any,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-123',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/優先度閾値/);
  });
});