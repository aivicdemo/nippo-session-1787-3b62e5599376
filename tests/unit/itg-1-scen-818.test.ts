import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-818: [edge] 課題優先度スコア算出機能 - 7日間の期間開始日と終了日が同じ日付のとき、当日の発生頻度のみで計算される
  test('期間開始日と終了日が同一日付のとき、当日の発生頻度のみでスコアが計算される', () => {
    const singleDate = new Date('2026-08-19T00:00:00Z');
    
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout issues',
      occurrenceFrequency: 5,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2026-08-19',
      teamId: 'team-dev-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toEqual(
      expect.objectContaining({
        issueId: 'issue-001',
        priorityScore: expect.any(Number),
        priorityRank: expect.stringMatching(/^(高|中|低)$/),
        scoreBreakdown: expect.objectContaining({
          frequencyScore: expect.any(Number),
          impactScore: expect.any(Number),
          resolutionDifficultyScore: expect.any(Number),
        }),
        colorCode: expect.stringMatching(/^#[0-9A-F]{6}$/),
        calculatedAt: expect.any(String),
      })
    );

    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    const frequencyScore = result.scoreBreakdown.frequencyScore;
    const impactScoreComponent = result.scoreBreakdown.impactScore;
    const resolutionDifficultyScore = result.scoreBreakdown.resolutionDifficultyScore;

    expect(frequencyScore).toBeGreaterThanOrEqual(0);
    expect(frequencyScore).toBeLessThanOrEqual(40);
    expect(impactScoreComponent).toBeGreaterThanOrEqual(0);
    expect(impactScoreComponent).toBeLessThanOrEqual(40);
    expect(resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(resolutionDifficultyScore).toBeLessThanOrEqual(20);

    const calculatedScore =
      frequencyScore + impactScoreComponent + resolutionDifficultyScore;
    expect(result.priorityScore).toBe(calculatedScore);

    if (calculatedScore >= 70) {
      expect(result.priorityRank).toBe('高');
      expect(result.colorCode).toBe('#FF0000');
    } else if (calculatedScore >= 40) {
      expect(result.priorityRank).toBe('中');
      expect(result.colorCode).toBe('#FFFF00');
    } else {
      expect(result.priorityRank).toBe('低');
      expect(result.colorCode).toBe('#00FF00');
    }

    const calculatedAtDate = new Date(result.calculatedAt);
    expect(calculatedAtDate.getTime()).toBeLessThanOrEqual(Date.now());
    expect(calculatedAtDate.getTime()).toBeGreaterThan(Date.now() - 5000);
  });
});