import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-604: [normal] 課題優先度スコア計算機能 - 抽出された課題が1件の場合、その課題に優先度スコアが付与される
  test('抽出された課題1件に対して優先度スコア65が付与される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '本番環境のメモリリーク問題',
      occurrenceFrequency: 1,
      impactScore: 65,
      affectedTeamCount: 1,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001'
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(65);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown).toEqual({
      frequencyScore: expect.any(Number),
      impactScore: expect.any(Number),
      resolutionDifficultyScore: expect.any(Number)
    });
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });
});