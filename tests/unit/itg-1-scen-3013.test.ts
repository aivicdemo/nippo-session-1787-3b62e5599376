import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け', () => {
  test('SCEN-3013: 複合スコア計算で端数が発生する入力から正確に丸められたスコアが算出される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISS-001',
      issueContent: 'システムレスポンス時間が低下している',
      occurrenceFrequency: 3.5,
      impactScore: 66.7,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-02-15T09:30:00Z',
      teamId: 'TEAM-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('ISS-001');
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.priorityScore) || result.priorityScore === Math.round(result.priorityScore * 100) / 100).toBe(true);
    expect(['高', '中', '低']).toContain(result.priorityRank);
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
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(result.colorCode);
    expect(result.calculatedAt).toBeDefined();
    const calculatedDate = new Date(result.calculatedAt);
    expect(calculatedDate instanceof Date && !isNaN(calculatedDate.getTime())).toBe(true);
    const expectedFrequencyScore = Math.round((3.5 / 10) * 40 * 100) / 100;
    const expectedImpactScore = Math.round((66.7 / 100) * 40 * 100) / 100;
    const expectedResolutionScore = Math.round((2.5 / 5) * 20 * 100) / 100;
    const expectedTotalScore = Math.round((expectedFrequencyScore + expectedImpactScore + expectedResolutionScore) * 100) / 100;
    expect(result.scoreBreakdown.frequencyScore).toBe(expectedFrequencyScore);
    expect(result.scoreBreakdown.impactScore).toBe(expectedImpactScore);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(expectedResolutionScore);
    expect(result.priorityScore).toBe(Math.min(100, Math.max(1, expectedTotalScore)));
  });
});