import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付与', () => {
  // SCEN-508
  test('チーム波及度スコアがちょうど閾値50で優先度が引き上げられる', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが頻繁に発生',
      occurrenceFrequency: 5,
      impactScore: 50,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toMatchObject({
      issueId: 'issue-001',
      priorityScore: expect.any(Number),
      priorityRank: expect.stringMatching(/^(高|中|低)$/),
      scoreBreakdown: expect.objectContaining({
        frequencyScore: expect.any(Number),
        impactScore: expect.any(Number),
        resolutionDifficultyScore: expect.any(Number),
      }),
      colorCode: expect.stringMatching(/^#[0-9A-F]{6}$/),
      calculatedAt: expect.any(String),
    });

    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);

    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);

    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    expect(result.priorityRank).toBe('高');

    if (result.priorityRank === '高') {
      expect(result.colorCode).toBe('#FF0000');
    }

    expect(new Date(result.calculatedAt).getTime()).toBeLessThanOrEqual(
      new Date().getTime()
    );
  });
});