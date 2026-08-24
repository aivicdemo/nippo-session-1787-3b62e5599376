import { describe, test, expect } from '@jest/globals';
import { prioritizeAndColorizeIssues, type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示する機能', () => {
  // SCEN-670
  test('色分けルール定義が null のときエラーを throw する', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
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
        {
          issueId: 'issue-003',
          priorityScore: 25,
          keyword: '軽微な表示ズレ',
          impactLevel: 'low',
        },
      ],
      colorThresholds: null as any,
      requestedBy: 'user-manager-001',
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/色分けルール定義/);
  });
});