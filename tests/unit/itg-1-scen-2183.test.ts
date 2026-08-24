import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  test('SCEN-2183: 優先度スコア計算時に端数が発生する場合、期待する丸めルールで処理される', () => {
    const input: Parameters<typeof calculateIssuePriorityScore>[0] = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 7,
      impactScore: 85.5,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.7,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-engineering-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(typeof result.priorityScore).toBe('number');
    expect(Number.isInteger(result.priorityScore)).toBe(true);
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(typeof result.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof result.scoreBreakdown.impactScore).toBe('number');
    expect(typeof result.scoreBreakdown.resolutionDifficultyScore).toBe('number');
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    const frequencyScoreWithDecimal = (7 / 30) * 40;
    const expectedFrequencyScore = Math.round(frequencyScoreWithDecimal * 10) / 10;
    expect([
      Math.round(frequencyScoreWithDecimal),
      Math.floor(frequencyScoreWithDecimal),
      Math.ceil(frequencyScoreWithDecimal),
    ]).toContain(result.scoreBreakdown.frequencyScore);

    const impactScoreWithDecimal = (85.5 / 100) * 40;
    const expectedImpactScore = Math.round(impactScoreWithDecimal * 10) / 10;
    expect([
      Math.round(impactScoreWithDecimal),
      Math.floor(impactScoreWithDecimal),
      Math.ceil(impactScoreWithDecimal),
    ]).toContain(result.scoreBreakdown.impactScore);

    const resolutionDifficultyWithDecimal = (2.7 / 7) * 20;
    const expectedResolutionDifficultyScore = Math.round(resolutionDifficultyWithDecimal * 10) / 10;
    expect([
      Math.round(resolutionDifficultyWithDecimal),
      Math.floor(resolutionDifficultyWithDecimal),
      Math.ceil(resolutionDifficultyWithDecimal),
    ]).toContain(result.scoreBreakdown.resolutionDifficultyScore);

    const totalPriorityScoreRaw =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;

    expect(result.priorityScore).toBe(Math.round(totalPriorityScoreRaw));

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
  });
});