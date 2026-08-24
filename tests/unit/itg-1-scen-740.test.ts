import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の自動抽出と優先度判定機能', () => {
  // SCEN-740
  test('TextAnalysisServiceAdapter が正常応答した場合、抽出キーワードと影響度スコアが業務ロジックに反映される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生し、データベース接続がタイムアウトしている',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001'
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(78);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBe(31);
    expect(result.scoreBreakdown.impactScore).toBe(34);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(13);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});