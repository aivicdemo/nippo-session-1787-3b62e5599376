import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  test('SCEN-923: 影響度スコア中位閾値（50）ちょうどのとき、中優先度に分類される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウン',
      occurrenceFrequency: 1,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 4.0,
      reportingDate: '2024-01-15',
      teamId: 'team-A',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityRank).toBe('中');
    expect(result.priorityScore).toBeGreaterThanOrEqual(40);
    expect(result.priorityScore).toBeLessThan(70);
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.scoreBreakdown.impactScore).toBe(20);
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.calculatedAt).toBeDefined();
  });
});