import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - High Priority Issue Extraction', () => {
  test('SCEN-2279: [normal] 優先対応課題抽出機能 - 優先度スコアが高い課題が1件の場合、その課題が優先対応リストに含まれる', () => {
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout in production environment',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(85);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.calculatedAt).toBeDefined();
    expect(typeof result.calculatedAt).toBe('string');
  });
});