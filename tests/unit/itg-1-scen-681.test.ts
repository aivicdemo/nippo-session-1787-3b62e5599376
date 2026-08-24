import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type IssueSummary, type ColorThresholdConfig, type ColorizedIssueList } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコアの色分け表示', () => {
  // SCEN-681: [error] 課題優先度色分け表示機能 - 課題オブジェクト内に発生頻度スコアが欠落しているときマッピング処理がスキップされエラーになる
  test('発生頻度スコアが欠落している課題オブジェクトに対してマッピング処理がスキップされエラーが発生する', () => {
    const issuesWithMissingFrequencyScore = [
      {
        issueId: 'issue-001',
        priorityScore: 75,
        keyword: 'database_performance',
        impactLevel: 'high',
      } as unknown as IssueSummary,
      {
        issueId: 'issue-002',
        priorityScore: 45,
        keyword: 'api_timeout',
        impactLevel: 'medium',
      } as unknown as IssueSummary,
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = 'user-dept-manager-001';

    expect(() => {
      prioritizeAndColorizeIssues(
        issuesWithMissingFrequencyScore,
        colorThresholds,
        requestedBy
      );
    }).toThrow(/frequencyScore/);
  });
});