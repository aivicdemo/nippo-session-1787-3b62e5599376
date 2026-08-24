import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  test('SCEN-2953: 発生頻度が低く波及度が高い課題は中程度スコアが算出される', () => {
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 2,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(40);
    expect(result.priorityScore).toBeLessThanOrEqual(60);
    expect(result.priorityScore).toBe(50);
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown.frequencyScore).toBe(8);
    expect(result.scoreBreakdown.impactScore).toBe(34);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(8);
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});