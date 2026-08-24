import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコアリング', () => {
  // SCEN-742: [normal] 課題の自動抽出と優先度判定機能 - 発生頻度が同じ課題は波及度スコアの高低で順序付けされる
  test('発生頻度が同じ課題は波及度スコアの高低で優先度が決定される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result).toEqual({
      issueId: 'ISSUE-001',
      priorityScore: expect.any(Number),
      priorityRank: expect.stringMatching(/^(高|中|低)$/),
      scoreBreakdown: {
        frequencyScore: expect.any(Number),
        impactScore: expect.any(Number),
        resolutionDifficultyScore: expect.any(Number),
      },
      colorCode: expect.stringMatching(/^#[0-9A-F]{6}$/),
      calculatedAt: expect.any(String),
    });

    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);

    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);

    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    const totalScoreBreakdown =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(totalScoreBreakdown).toBe(result.priorityScore);

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

    const calculatedAtDate = new Date(result.calculatedAt);
    expect(calculatedAtDate.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(calculatedAtDate.getTime()).toBeGreaterThan(new Date().getTime() - 60000);
  });
});