import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能', () => {
  // SCEN-674: [error] 課題優先度色分け表示機能 - 赤色のしきい値が負の数のとき色分けルールが不正でエラーになる
  test('赤色のしきい値が負の数のとき、入力値検証エラーを発生させる', () => {
    const issues = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'データベース接続エラー',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 55,
        keyword: 'UI レイアウト崩れ',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-003',
        priorityScore: 25,
        keyword: 'ドキュメント作成',
        impactLevel: 'low',
      },
    ];

    const colorThresholds = {
      redThresholdMin: -5,
      yellowThresholdMin: 40,
    };

    const requestedBy = 'user-001';

    expect(() =>
      prioritizeAndColorizeIssues({
        issues,
        colorThresholds,
        requestedBy,
      })
    ).toThrow(/赤色のしきい値/);
  });
});