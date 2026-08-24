import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示', () => {
  // SCEN-1737
  test('色分けルール定義が null のとき色分け処理がエラーになる', () => {
    const issues = [
      {
        issueId: 'issue-001',
        priorityScore: 75,
        keyword: 'システム遅延',
        impactLevel: 'high',
      },
    ];

    const colorThresholds = null as any;

    const requestedBy = 'user-dept-head-001';

    expect(() =>
      prioritizeAndColorizeIssues(
        { issues, colorThresholds, requestedBy },
      ),
    ).toThrow(/Color rule definition is null or undefined/);
  });
});