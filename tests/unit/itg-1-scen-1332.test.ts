import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList, type IssueSummary } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues', () => {
  // SCEN-1332: [error] 課題優先度の色分け表示機能 - 優先度スコアが null のとき色分け割り当てを中止し例外を発生させる
  test('should throw error when priorityScore is null', () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: null as any,
          keyword: '本番環境障害対応中',
          impactLevel: 'high'
        } as IssueSummary
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