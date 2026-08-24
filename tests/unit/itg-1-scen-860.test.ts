import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('ダッシュボード色分け表示機能 - アクセス権限チェック', () => {
  test('SCEN-860: 部長以外の権限でアクセスしたときアクセス拒否エラーが発生する', () => {
    const issuesSummary = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'データベース接続エラー',
        impactLevel: 'high' as const,
      },
      {
        issueId: 'issue-002',
        priorityScore: 45,
        keyword: 'ドキュメント未更新',
        impactLevel: 'medium' as const,
      },
    ];

    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const nonManagerUserId = 'user-general-member';

    expect(() =>
      prioritizeAndColorizeIssues(
        {
          issues: issuesSummary,
          colorThresholds: colorThresholds,
          requestedBy: nonManagerUserId,
        },
        { userRole: 'engineer' }
      )
    ).toThrow(/権限/);
  });
});