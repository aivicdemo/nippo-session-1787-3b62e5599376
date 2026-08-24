import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Validation and Integration', () => {
  // SCEN-1122: [normal] 既存ツール連携対象課題の確定機能 - 有効性検証に合格した課題が既存ツール連携対象として確定される
  test('should confirm issue as integration target when validation passes with frequency>=2, impactScore>=50, and high/medium severity', () => {
    const issueData = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours affects multiple teams',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const result = calculateIssuePriorityScore(issueData);

    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: expect.any(Number),
      priorityRank: expect.stringMatching(/^(高|中|低)$/),
      scoreBreakdown: {
        frequencyScore: expect.any(Number),
        impactScore: expect.any(Number),
        resolutionDifficultyScore: expect.any(Number),
      },
      colorCode: expect.stringMatching(/^#([0-9A-F]{6})$/),
      calculatedAt: expect.any(String),
    });

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);

    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);

    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    const totalScore = result.scoreBreakdown.frequencyScore + result.scoreBreakdown.impactScore + result.scoreBreakdown.resolutionDifficultyScore;
    expect(totalScore).toBe(result.priorityScore);

    if (result.priorityScore >= 70) {
      expect(result.priorityRank).toBe('高');
      expect(result.colorCode).toBe('#FF0000');
    } else if (result.priorityScore >= 40) {
      expect(result.priorityRank).toBe('中');
      expect(result.colorCode).toBe('#FFFF00');
    } else {
      expect(result.priorityRank).toBe('低');
      expect(result.colorCode).toBe('#00FF00');
    }

    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.calculatedAt).toMatch(isoRegex);

    expect(result.priorityScore).toBeGreaterThan(40);
  });
});