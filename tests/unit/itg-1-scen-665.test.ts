import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度色分け表示機能', () => {
  // SCEN-665
  test('課題IDがundefinedのとき、色分け処理はエラーを発生させ、システムは適切に処理する', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: undefined as any,
          priorityScore: 85,
          keyword: 'データベース接続エラー',
          impactLevel: 'high',
        },
        {
          issueId: 'issue-002',
          priorityScore: 55,
          keyword: 'ログ出力遅延',
          impactLevel: 'medium',
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/課題ID|issueId|不正/i);
  });
});