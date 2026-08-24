import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('ダッシュボード色分け表示機能 - ユーザー権限チェック', () => {
  // SCEN-859
  test('ユーザー権限がnullで渡されたときエラーになる', () => {
    const issues = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'パフォーマンス問題',
        impactLevel: 'high' as const,
      },
      {
        issueId: 'issue-002',
        priorityScore: 45,
        keyword: 'ドキュメント不足',
        impactLevel: 'medium' as const,
      },
    ];

    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = null as any;

    expect(() =>
      prioritizeAndColorizeIssues({
        issues,
        colorThresholds,
        requestedBy,
      })
    ).toThrow(/ユーザー権限/);
  });
});