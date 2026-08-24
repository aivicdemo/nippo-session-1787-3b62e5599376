import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore, type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Impact Score Rounding', () => {
  // SCEN-2383: [edge] 課題影響度スコアの算出 - 複数の影響要因から波及度スコアを計算して小数が発生したとき、適切に丸められる
  test('should calculate priority score with multiple impact factors and properly round decimal values', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 12,
      impactScore: 38,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-08-19T09:00:00Z',
      teamId: 'TEAM-A'
    };

    const output = calculateIssuePriorityScore(input);

    expect(output.issueId).toBe('ISSUE-001');
    expect(typeof output.priorityScore).toBe('number');
    expect(output.priorityScore).toBeGreaterThanOrEqual(1);
    expect(output.priorityScore).toBeLessThanOrEqual(100);
    expect(Number.isInteger(output.priorityScore)).toBe(true);
    expect(output.priorityRank).toMatch(/^(高|中|低)$/);
    expect(output.scoreBreakdown).toBeDefined();
    expect(typeof output.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof output.scoreBreakdown.impactScore).toBe('number');
    expect(typeof output.scoreBreakdown.resolutionDifficultyScore).toBe('number');
    expect(output.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(output.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(output.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(output.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(output.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});