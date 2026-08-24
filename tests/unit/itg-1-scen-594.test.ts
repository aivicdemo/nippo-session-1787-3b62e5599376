import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-594: [edge] 課題優先度判定機能 - 影響度スコアが74（高位の閾値直下）の場合、優先度ランクが中に判定される
  test('影響度スコア74のとき優先度ランクが中に判定される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続エラー',
      occurrenceFrequency: 5,
      impactScore: 74,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    const output: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(output.issueId).toBe('ISSUE-001');
    expect(output.priorityRank).toBe('中');
    expect(output.priorityScore).toBeGreaterThanOrEqual(40);
    expect(output.priorityScore).toBeLessThan(70);
    expect(output.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(output.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(output.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(output.colorCode).toBe('#FFFF00');
    expect(typeof output.calculatedAt).toBe('string');
  });
});