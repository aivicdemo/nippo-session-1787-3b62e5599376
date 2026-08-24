import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題影響度判定・波及度スコア計算機能', () => {
  // SCEN-2793
  test('チーム波及度スコアが高影響度閾値直上（71）で高影響と判定される', () => {
    // Arrange
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーによるシステム停止',
      occurrenceFrequency: 5,
      impactScore: 71,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // Act
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // Assert
    // 高影響度の判定条件: スコア ≥ 71
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.scoreBreakdown.impactScore).toBe(71);
    expect(typeof result.calculatedAt).toBe('string');
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});