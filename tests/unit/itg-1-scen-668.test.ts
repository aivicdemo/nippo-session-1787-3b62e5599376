import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け表示機能', () => {
  // SCEN-668
  test('課題リストが undefined のとき色分けルール適用がスキップされエラーになる', () => {
    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };
    const requestedBy = 'user-001';

    expect(() =>
      prioritizeAndColorizeIssues(
        {
          issues: undefined as any,
          colorThresholds,
          requestedBy,
        }
      )
    ).toThrow(/課題/);
  });
});