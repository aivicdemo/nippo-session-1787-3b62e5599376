import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-891
  test('当日の複数日報から抽出された課題がマージされ、統合優先度スコアが算出される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-merged-001',
      issueContent: 'API連携遅延、データベース接続、ドキュメント不足',
      occurrenceFrequency: 4,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-merged-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(typeof result.priorityScore).toBe('number');
    expect(Number.isInteger(result.priorityScore)).toBe(true);

    expect(['高', '中', '低']).toContain(result.priorityRank);

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

    const calculatedSum =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(result.priorityScore).toBe(calculatedSum);

    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(result.colorCode);

    expect(result.calculatedAt).toBeDefined();
    const calculatedDate = new Date(result.calculatedAt);
    expect(calculatedDate.getFullYear()).toBe(2024);
    expect(isNaN(calculatedDate.getTime())).toBe(false);

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