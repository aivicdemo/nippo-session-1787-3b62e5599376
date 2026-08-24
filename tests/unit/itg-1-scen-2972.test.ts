import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-2972: [error] 課題優先度スコア自動計算機能 - チーム波及度スコアが 0 のとき、優先度スコア計算がエラーになる
  test('チーム波及度スコアが0のとき、優先度スコア計算エラーを発生させる', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生している',
      occurrenceFrequency: 5,
      impactScore: 0,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001'
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/チーム波及度スコア|impact|ゼロ|division/i);
  });
});