import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Impact Score Threshold', () => {
  // SCEN-1541: [edge] 課題優先度スコア算出機能 - 影響度スコアが波及度判定閾値未満（例：69ポイント）で低ランク維持される
  test('should maintain low priority rank when impact score is below threshold (69 < 70)', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 2,
      impactScore: 69,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A'
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityRank).toBe('低');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.scoreBreakdown.impactScore).toBe(27);
    expect(result.colorCode).toBe('#00FF00');
  });
});