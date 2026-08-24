import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1348: [edge] 課題影響度判定機能 - 課題の影響度スコアが中優先度閾値超過（例：41点）で中優先度に判定される
  test('影響度スコア41点で中優先度判定される', () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue(41),
      classifyIssueSeverity: jest.fn().mockResolvedValue('MEDIUM')
    };

    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続エラーが間欠的に発生している',
      occurrenceFrequency: 5,
      impactScore: 41,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001'
    };

    const mediumPriorityThreshold = 40;
    const highPriorityThreshold = 70;

    // Act
    const result = calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);

    // Assert
    expect(result).toBeDefined();
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(41);
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBe(41);
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.calculatedAt).toBeDefined();
  });
});