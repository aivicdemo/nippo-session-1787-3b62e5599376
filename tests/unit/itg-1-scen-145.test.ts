import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-145
  test('チーム波及度スコアが100のとき、高優先度として分類される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'システム全体の重大障害が発生',
      occurrenceFrequency: 5,
      impactScore: 100,
      affectedTeamCount: 8,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toBeDefined();
    expect(new Date(result.calculatedAt).getTime()).toBeGreaterThan(0);
  });
});