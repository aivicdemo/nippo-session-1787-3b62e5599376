import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題影響度判定・優先度スコア付与', () => {
  // SCEN-852
  test('[error] 影響度スコアが100を超えたときエラーハンドリングが発動する', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生した',
      occurrenceFrequency: 5,
      impactScore: 101,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/影響度スコアが無効な値です/);
  });
});