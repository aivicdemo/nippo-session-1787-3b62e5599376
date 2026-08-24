import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-719: [error] 優先度スコアが 100 を超えるとき処理がエラーになる
  test('優先度スコアが100を超える場合、バリデーションエラーが発生し代替表示が返される', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 101, // 100を超える値
          keyword: 'システム障害',
          impactLevel: 'high'
        },
        {
          issueId: 'issue-002',
          priorityScore: 75,
          keyword: 'パフォーマンス低下',
          impactLevel: 'medium'
        }
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40
      },
      requestedBy: 'user-001'
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/優先度スコア/);
  });
});