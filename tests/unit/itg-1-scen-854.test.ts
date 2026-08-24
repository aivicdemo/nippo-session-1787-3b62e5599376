import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定・優先度スコア付与機能', () => {
  // SCEN-854: [error] 優先度スコアが計算されないまま返されたときエラーになる
  test('優先度スコアが計算されない場合にエラーを発生させる', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システムダウンが発生した',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/優先度スコア|スコア値/);
  });
});