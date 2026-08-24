import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation', () => {
  // SCEN-890
  test('should calculate issue priority score for single daily report with extracted keywords', () => {
    // Arrange: テストデータの構築
    const currentDate = '2024-01-15T09:30:00Z';
    const reportingDate = '2024-01-15';
    const teamId = 'team-001';
    const issueId = 'issue-001';
    const issueContent = 'データベース接続タイムアウト問題とAPI レスポンス遅延が発生';

    const input: IssuePriorityScoringInput = {
      issueId: issueId,
      issueContent: issueContent,
      occurrenceFrequency: 2,
      impactScore: 68,
      affectedTeamCount: 1,
      resolutionDaysAverage: 2.5,
      reportingDate: reportingDate,
      teamId: teamId,
    };

    // Act: 優先度スコア計算関数を実行
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // Assert: 結果を検証
    expect(result).toBeDefined();
    expect(result.issueId).toBe(issueId);
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.calculatedAt).toBeDefined();
    expect(new Date(result.calculatedAt)).toBeInstanceOf(Date);
  });
});