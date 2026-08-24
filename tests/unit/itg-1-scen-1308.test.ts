import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring', () => {
  test('SCEN-1308: calculateIssuePriorityScore returns consistent results on repeated calls with identical input', () => {
    const testInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラー発生',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 4,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001'
    };

    const firstResult = calculateIssuePriorityScore(testInput);
    const secondResult = calculateIssuePriorityScore(testInput);

    expect(firstResult.issueId).toBe(secondResult.issueId);
    expect(firstResult.priorityScore).toBe(secondResult.priorityScore);
    expect(firstResult.priorityRank).toBe(secondResult.priorityRank);
    expect(firstResult.scoreBreakdown.frequencyScore).toBe(
      secondResult.scoreBreakdown.frequencyScore
    );
    expect(firstResult.scoreBreakdown.impactScore).toBe(
      secondResult.scoreBreakdown.impactScore
    );
    expect(firstResult.scoreBreakdown.resolutionDifficultyScore).toBe(
      secondResult.scoreBreakdown.resolutionDifficultyScore
    );
    expect(firstResult.colorCode).toBe(secondResult.colorCode);
    expect(firstResult.calculatedAt).toBe(secondResult.calculatedAt);
  });
});