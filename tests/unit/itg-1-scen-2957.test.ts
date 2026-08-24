import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2957: [normal] 課題影響度判定機能 - TextAnalysisServiceAdapterが正常応答したとき、課題のチーム波及度スコア（0-100）が返される
  test('TextAnalysisServiceAdapterが正常応答して、チーム波及度スコアが0以上100以下の整数値で返却される', () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 65
      }),
      classifyIssueSeverity: jest.fn()
    };

    const issuePriorityScoringInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム全体の障害により複数のプロジェクトが影響を受ける可能性がある',
      occurrenceFrequency: 3,
      impactScore: 65,
      affectedTeamCount: 4,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001'
    };

    // Act
    const result = calculateIssuePriorityScore(
      issuePriorityScoringInput,
      mockTextAnalysisServiceAdapter
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.priorityScore)).toBe(true);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toBeDefined();
  });
});