import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Dashboard Colorization - Negative Priority Score Error Handling', () => {
  // SCEN-2985: [error] 課題ダッシュボード色分け表示機能 - 優先度スコアが負の値のとき、色分け判定がエラーになる
  test('should throw or handle error when priority score is negative value', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: -5,
          keyword: 'database_connection_failure',
          impactLevel: 'high'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-001'
    };

    expect(() => {
      prioritizeAndColorizeIssues(input);
    }).toThrow(/優先度スコア/);
  });
});