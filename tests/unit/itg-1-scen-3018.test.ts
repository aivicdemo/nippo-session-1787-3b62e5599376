import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算機能', () => {
  // SCEN-3018
  test('月初1日に記録された課題について集計期間開始日境界で正確にスコアが算出される', () => {
    const referenceDate = new Date('2026-09-01T00:00:00Z');
    const testIssueId = 'issue_20260901_001';
    const testTeamId = 'team_alpha';
    const testUserId = 'user_engineer_001';
    const reportingDate = '2026-09-01';
    const issueContent = 'データベース接続タイムアウト問題が頻発';
    const occurrenceFrequency = 3;
    const impactScore = 75;
    const affectedTeamCount = 2;
    const resolutionDaysAverage = 2.5;

    const input: IssuePriorityScoringInput = {
      issueId: testIssueId,
      issueContent: issueContent,
      occurrenceFrequency: occurrenceFrequency,
      impactScore: impactScore,
      affectedTeamCount: affectedTeamCount,
      resolutionDaysAverage: resolutionDaysAverage,
      reportingDate: reportingDate,
      teamId: testTeamId,
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result).toBeDefined();
    expect(result.issueId).toBe(testIssueId);
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(typeof result.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof result.scoreBreakdown.impactScore).toBe('number');
    expect(typeof result.scoreBreakdown.resolutionDifficultyScore).toBe('number');
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    const totalScore =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(totalScore).toBe(result.priorityScore);

    if (result.priorityScore >= 70) {
      expect(result.priorityRank).toBe('高');
      expect(result.colorCode).toBe('#FF0000');
    } else if (result.priorityScore >= 40) {
      expect(result.priorityRank).toBe('中');
      expect(result.colorCode).toBe('#FFFF00');
    } else {
      expect(result.priorityRank).toBe('低');
      expect(result.colorCode).toBe('#00FF00');
    }
  });
});