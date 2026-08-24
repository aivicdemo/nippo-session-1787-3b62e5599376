import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type IssueSummary, type ColorThresholdConfig, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度色分け表示機能', () => {
  test('SCEN-662: 優先度スコアが負の数のとき色分けルールが適用されずエラーになる', () => {
    const issues_with_negative_score: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: -5,
        keyword: 'システム障害',
        impactLevel: 'high'
      }
    ];

    const color_thresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40
    };

    const requested_by = 'user-001';

    expect(() =>
      prioritizeAndColorizeIssues(
        issues_with_negative_score,
        color_thresholds,
        requested_by
      )
    ).toThrow(/優先度スコア|スコア|負/);
  });
});