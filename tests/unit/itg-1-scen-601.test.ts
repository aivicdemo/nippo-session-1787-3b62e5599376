import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度判定機能 - 影響度スコアの小数点計算', () => {
  // SCEN-601
  test('影響度スコア67.5が端数ありの状態で正確に処理され、優先度判定と内部保持が正確である', () => {
    const issueInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが頻発',
      occurrenceFrequency: 12,
      impactScore: 67.5,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result = calculateIssuePriorityScore(issueInput);

    expect(result.issueId).toBe('issue-001');
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    const frequencyScoreComponent = (12 / 30) * 40;
    const impactScoreComponent = (67.5 / 100) * 40;
    const resolutionDifficultyComponent = (2.5 / 10) * 20;
    const expectedPriorityScore = frequencyScoreComponent + impactScoreComponent + resolutionDifficultyComponent;

    expect(result.priorityScore).toBeCloseTo(expectedPriorityScore, 5);

    if (expectedPriorityScore >= 70) {
      expect(result.priorityRank).toBe('高');
      expect(result.colorCode).toBe('#FF0000');
    } else if (expectedPriorityScore >= 40) {
      expect(result.priorityRank).toBe('中');
      expect(result.colorCode).toBe('#FFFF00');
    } else {
      expect(result.priorityRank).toBe('低');
      expect(result.colorCode).toBe('#00FF00');
    }

    expect(result.scoreBreakdown).toEqual({
      frequencyScore: expect.any(Number),
      impactScore: expect.any(Number),
      resolutionDifficultyScore: expect.any(Number),
    });

    expect(result.scoreBreakdown.impactScore).toBeCloseTo(impactScoreComponent, 5);

    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});