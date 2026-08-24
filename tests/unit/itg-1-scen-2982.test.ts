import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付けの機能', () => {
  // SCEN-2982
  test('課題抽出結果の配列内で課題IDがundefinedのとき、優先度スコア計算がエラーになる', () => {
    const malformedIssue = {
      issueId: undefined,
      issueContent: 'ビルドエラーが頻発している',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    expect(() => {
      calculateIssuePriorityScore(malformedIssue);
    }).toThrow(/issueId/);
  });
});