import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-816
  test('[edge] 課題優先度スコア算出機能 - チーム波及度スコアが99のとき、最大優先度未満として計算される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-816-001',
      issueContent: 'テスト課題：高影響度スコアケース',
      occurrenceFrequency: 25,
      impactScore: 99,
      affectedTeamCount: 8,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-816-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(99);
    expect(result.priorityScore).toBeLessThan(100);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBe(39.6);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toBeDefined();
    expect(typeof result.calculatedAt).toBe('string');
  });
});