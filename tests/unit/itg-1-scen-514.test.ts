import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-514: [edge] 複数の課題が同一優先度スコアを持つ場合、発生頻度の高い順に並序される
  test('同一スコアの課題が発生頻度の高い順に並序される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Multiple infrastructure issues',
      occurrenceFrequency: 5,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: expect.any(Number),
      priorityRank: expect.any(String),
      scoreBreakdown: {
        frequencyScore: expect.any(Number),
        impactScore: expect.any(Number),
        resolutionDifficultyScore: expect.any(Number),
      },
      colorCode: expect.any(String),
      calculatedAt: expect.any(String),
    });

    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(['高', '中', '低']).toContain(result.priorityRank);
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(result.colorCode);
  });
});