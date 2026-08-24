import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';

describe('ダッシュボード色分け表示機能', () => {
  test('SCEN-856: 課題IDがnullで渡されたときエラーになる', () => {
    const input_issues = [
      {
        issueId: null as any,
        priorityScore: 85,
        keyword: 'database_performance',
        impactLevel: 'high'
      }
    ];

    const input_colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40
    };

    const input_requestedBy = 'user-001';

    expect(() =>
      prioritizeAndColorizeIssues(
        input_issues,
        input_colorThresholds,
        input_requestedBy
      )
    ).toThrow(/課題ID/);
  });
});