import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue colorization with priority threshold', () => {
  // SCEN-1355: [edge] 優先度スコア色分け表示機能 - 低優先度課題がちょうど閾値（例：40点未満）で緑色に表示される
  test('should display issue with priority score 39 (below threshold 40) in green color', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 39,
          keyword: 'テスト対象の低優先度課題',
          impactLevel: 'low'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-dept-manager-001'
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe('issue-001');
    expect(result.colorizedIssues[0].priorityScore).toBe(39);
    expect(result.colorizedIssues[0].highlightColor).toBe('green');
    expect(result.colorDistribution.green).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.red).toBe(0);
  });
});