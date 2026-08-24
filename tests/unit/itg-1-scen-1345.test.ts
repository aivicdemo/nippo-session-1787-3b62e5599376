import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1345
  test('[edge] 課題影響度判定機能 - 課題の影響度スコアが高優先度閾値超過（例：71点）で高優先度に判定される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-db-timeout-001',
      issueContent: '本番環境のデータベース接続タイムアウト問題',
      occurrenceFrequency: 5,
      impactScore: 71,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-backend-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-db-timeout-001');
    expect(result.priorityScore).toBe(88);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown.frequencyScore).toBe(20);
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(15);
    expect(typeof result.calculatedAt).toBe('string');
    expect(new Date(result.calculatedAt).getTime()).toBeGreaterThan(0);
  });
});