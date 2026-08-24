import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type IssueSummary, type ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('ダッシュボード色分け表示機能 - 課題IDが空文字列の場合', () => {
  // SCEN-857
  test('課題IDが空文字列で渡されたときエラーが throw される', () => {
    const issues: IssueSummary[] = [
      {
        issueId: '',
        priorityScore: 85,
        keyword: 'データベース接続エラー',
        impactLevel: 'high',
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = 'user-001';

    expect(() =>
      prioritizeAndColorizeIssues(issues, colorThresholds, requestedBy)
    ).toThrow(/課題ID/);
  });
});