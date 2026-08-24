import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList, type IssueSummary, type ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - 課題優先度スコアに基づく色分け表示機能', () => {
  // SCEN-1738: [error] 課題優先度スコアに基づく色分け表示機能 - 部長ユーザーID が null のとき部長向けダッシュボード組立がエラーになる
  test('requestedBy が null のとき TypeError を throw する', () => {
    const issues: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'パフォーマンス問題',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 55,
        keyword: 'ドキュメント不備',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-003',
        priorityScore: 25,
        keyword: 'UI改善希望',
        impactLevel: 'low',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: null as any,
    };

    expect(() => {
      prioritizeAndColorizeIssues(input);
    }).toThrow(/requestedBy/);
  });
});