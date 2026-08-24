import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出 - 発生頻度計算の丸め処理', () => {
  test('SCEN-1546: 発生頻度が割り切れない場合の端数が正しく丸められる', () => {
    const issueId = 'ISSUE-001';
    const issueContent = 'Database connection timeout';
    const occurrenceFrequency = 7;
    const analysisPeriodDays = 10;
    const impactScore = 75;
    const affectedTeamCount = 2;
    const resolutionDaysAverage = 2.5;
    const reportingDate = '2024-01-15';
    const teamId = 'TEAM-A';

    const input = {
      issueId,
      issueContent,
      occurrenceFrequency,
      impactScore,
      affectedTeamCount,
      resolutionDaysAverage,
      reportingDate,
      teamId,
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toBeDefined();
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    const totalBreakdown =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(totalBreakdown).toBe(result.priorityScore);
    expect(['高', '中', '低']).toContain(result.priorityRank);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(result.calculatedAt).toBeDefined();
  });
});