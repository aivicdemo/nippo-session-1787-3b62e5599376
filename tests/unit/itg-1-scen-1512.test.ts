import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  test('SCEN-1512: 発生頻度が高く影響度が高い課題は優先度ランク「高」に分類される', () => {
    // Arrange
    const issueInput = {
      issueId: 'issue-001',
      issueContent: 'システムパフォーマンス低下',
      occurrenceFrequency: 7,
      impactScore: 80,
      affectedTeamCount: 5,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    // Act
    const result = calculateIssuePriorityScore(issueInput);

    // Assert
    expect(result.priorityRank).toBe('高');
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore + result.scoreBreakdown.impactScore + result.scoreBreakdown.resolutionDifficultyScore).toBe(result.priorityScore);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toBeDefined();
    expect(new Date(result.calculatedAt)).toBeInstanceOf(Date);
  });
});