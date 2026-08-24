import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-1532
  test('発生頻度が正の値だが波及度スコアが0のとき計算結果が無効になる', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-test-001',
      issueContent: 'テスト用課題',
      occurrenceFrequency: 5,
      impactScore: 0,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input);
    }).toThrow(/波及度/);
  });
});