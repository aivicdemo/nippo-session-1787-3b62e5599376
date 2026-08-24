import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-1542: [edge] 課題優先度スコア算出機能 - 影響度スコアが波及度判定閾値超過（例：71ポイント）で高ランクに昇格される
  test('影響度スコア71ポイント（閾値70超過）の課題は、ランクが高に昇格される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続タイムアウトが頻発',
      occurrenceFrequency: 5,
      impactScore: 71,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.impactScore).toBe(28);
    expect(result.colorCode).toBe('#FF0000');
    expect(typeof result.calculatedAt).toBe('string');
  });
});