import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1092: [edge] 課題影響度判定機能 - チーム波及度スコアがちょうど100で判定される
  test('チーム波及度スコアが正確に100の場合、波及度レベルは「チーム全体への波及あり」と分類される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-edge-100',
      issueContent: 'システム全体のパフォーマンス低下 システム障害 全チーム影響',
      occurrenceFrequency: 5,
      impactScore: 100,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-edge-100');
    expect(result.priorityScore).toBe(100);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toBe('#FF0000');
    expect(typeof result.calculatedAt).toBe('string');
  });
});