import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度判定機能 - 影響度スコアの閾値判定', () => {
  // SCEN-593
  test('影響度スコアがちょうど75（高位の閾値）の場合、優先度ランクが高に判定される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム全体に影響を与える重大な不具合',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityRank).toBe('高');
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.calculatedAt).toBeDefined();
  });
});