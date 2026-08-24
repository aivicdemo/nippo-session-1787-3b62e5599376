import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1124
  test('有効性検証済みの課題に対してチーム波及度スコアが正常に算出される', () => {
    const issueId = 'ISSUE-001';
    const keyword = 'データベース接続エラー';
    const occurrenceFrequency = 5;
    const affectedTeamCount = 3;
    const resolutionDaysAverage = 2;
    const reportingDate = '2024-01-15T10:30:00Z';
    const teamId = 'TEAM-A';
    const impactScore = 75;

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(impactScore),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId,
      issueContent: keyword,
      occurrenceFrequency,
      impactScore,
      affectedTeamCount,
      resolutionDaysAverage,
      reportingDate,
      teamId,
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);

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

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(keyword);
    expect(result.scoreBreakdown.impactScore).toBe(impactScore);
    expect(result.calculatedAt).toBeTruthy();
  });
});