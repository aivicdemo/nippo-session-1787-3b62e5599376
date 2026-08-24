import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  test('SCEN-721: 影響度スコアが0未満のとき処理がエラーになる', () => {
    const input = {
      issues: [
        {
          issueId: 'issue-001',
          priorityScore: 75,
          keyword: 'データベース接続エラー',
          impactLevel: 'high' as const,
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: 'user-001',
    };

    const invalidIssue = {
      issueId: 'issue-002',
      priorityScore: 50,
      keyword: 'パフォーマンス低下',
      impactLevel: 'medium' as const,
    };

    const issuesWithInvalidImpactScore = [
      ...input.issues,
      {
        ...invalidIssue,
        impactScore: -5,
      },
    ];

    expect(() => {
      prioritizeAndColorizeIssues({
        ...input,
        issues: issuesWithInvalidImpactScore as any,
      });
    }).toThrow(/影響度スコア/);
  });
});