import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-669: [error] 課題優先度色分け表示機能 - 課題リストが空配列のときマッピングがスキップされエラーになる
  test('課題リストが空配列の場合、色分けマッピングがスキップされて例外エラーが発生すること', () => {
    const emptyIssueList: any[] = [];
    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };
    const requestedBy = 'user-001';

    expect(() =>
      prioritizeAndColorizeIssues(
        {
          issues: emptyIssueList,
          colorThresholds,
          requestedBy,
        }
      )
    ).toThrow(/map|Cannot read/);
  });
});