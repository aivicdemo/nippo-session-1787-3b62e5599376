import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation', () => {
  // SCEN-774: [edge] 課題の優先度スコア算出機能 - 同一課題が複数日報に出現したとき、発生頻度がちょうど閾値と一致する場合に正規化される
  test('should normalize frequency score to 1.0 when occurrence frequency exactly matches threshold', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生している',
      occurrenceFrequency: 10,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    const frequencyThreshold = 10;
    const expectedFrequencyScore = 40;
    const expectedImpactScore = 40;
    const expectedResolutionDifficultyScore = 10;
    const expectedTotalScore = 90;
    const expectedPriorityRank = '高';
    const expectedColorCode = '#FF0000';

    const result = calculateIssuePriorityScore(input, {
      frequencyThreshold,
      impactScoreWeight: 1.0,
      resolutionDifficultyWeight: 0.5,
      highPriorityThreshold: 70,
      mediumPriorityThreshold: 40,
    });

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(expectedTotalScore);
    expect(result.priorityRank).toBe(expectedPriorityRank);
    expect(result.scoreBreakdown.frequencyScore).toBe(expectedFrequencyScore);
    expect(result.scoreBreakdown.impactScore).toBe(expectedImpactScore);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(
      expectedResolutionDifficultyScore
    );
    expect(result.colorCode).toBe(expectedColorCode);
    expect(result.calculatedAt).toBeDefined();
  });
});

interface IssuePriorityScoringInput {
  issueId: string;
  issueContent: string;
  occurrenceFrequency: number;
  impactScore: number;
  affectedTeamCount: number;
  resolutionDaysAverage: number;
  reportingDate: string;
  teamId: string;
}