import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2954: [normal] 課題優先度スコア算出機能 - 発生頻度が低く波及度も低い課題は低スコアが算出される
  test('発生頻度が低く波及度も低い課題は低スコアが算出される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ keyword: 'test_issue', frequency: 1 }],
        totalKeywordCount: 1,
        extractedAt: new Date('2024-01-15T11:00:00Z'),
        analysisPeriodDays: 7,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'test_issue',
        impactScore: 15,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'test_issue',
        severity: 'low',
      }),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'test issue content',
      occurrenceFrequency: 1,
      impactScore: 15,
      affectedTeamCount: 1,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);

    expect(result).toBeDefined();
    expect(result.priorityScore).toBeLessThanOrEqual(25);
    expect(result.priorityScore).toBeGreaterThanOrEqual(10);
    expect(result.priorityRank).toBe('低');
    expect(result.scoreBreakdown.frequencyScore).toBe(0.3);
    expect(result.scoreBreakdown.impactScore).toBe(10.5);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toBe('#00FF00');
    expect(result.issueId).toBe('issue-001');
    expect(result.calculatedAt).toBeDefined();
  });
});