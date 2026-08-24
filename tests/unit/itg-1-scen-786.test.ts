import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-786
  test('過去7日間に課題キーワードが複数件の場合、各キーワードの発生頻度が正しく集計されて優先度スコアに反映される', () => {
    const baseDate = new Date('2024-01-15T09:00:00Z');
    const sevenDaysAgo = new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000);

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウンが発生した。デプロイエラーも関連。ネットワーク遅延も報告されている。',
      occurrenceFrequency: 3,
      impactScore: 80,
      affectedTeamCount: 4,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const output: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(output.issueId).toBe('issue-001');
    expect(typeof output.priorityScore).toBe('number');
    expect(output.priorityScore).toBeGreaterThanOrEqual(1);
    expect(output.priorityScore).toBeLessThanOrEqual(100);
    expect(['高', '中', '低']).toContain(output.priorityRank);
    expect(output.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(output.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(output.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(output.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(output.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(output.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const expectedFrequencyScore = Math.min((3 / 10) * 40, 40);
    const expectedImpactScore = Math.min((80 / 100) * 40, 40);
    const expectedResolutionDifficultyScore = Math.min((2 / 5) * 20, 20);
    const expectedPriorityScore = Math.round(
      expectedFrequencyScore + expectedImpactScore + expectedResolutionDifficultyScore
    );

    expect(output.scoreBreakdown.frequencyScore).toBe(expectedFrequencyScore);
    expect(output.scoreBreakdown.impactScore).toBe(expectedImpactScore);
    expect(output.scoreBreakdown.resolutionDifficultyScore).toBe(expectedResolutionDifficultyScore);
    expect(output.priorityScore).toBe(expectedPriorityScore);

    if (expectedPriorityScore >= 70) {
      expect(output.priorityRank).toBe('高');
      expect(output.colorCode).toBe('#FF0000');
    } else if (expectedPriorityScore >= 40) {
      expect(output.priorityRank).toBe('中');
      expect(output.colorCode).toBe('#FFFF00');
    } else {
      expect(output.priorityRank).toBe('低');
      expect(output.colorCode).toBe('#00FF00');
    }
  });
});