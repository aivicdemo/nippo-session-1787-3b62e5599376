import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Impact Score Calculation', () => {
  // SCEN-2792: [edge] 課題影響度判定・波及度スコア計算機能 - チーム波及度スコアが高影響度閾値直下（69）で中影響と判定される
  test('should classify issue as MEDIUM priority when impact score is 69 (just below high threshold of 70)', () => {
    const issuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが複数チームの日報送信機能に影響',
      occurrenceFrequency: 3,
      impactScore: 69,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['データベース接続エラー', 'ログイン失敗'],
        frequency: 3,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(69),
      classifyIssueSeverity: jest.fn().mockResolvedValue('MEDIUM'),
    };

    const result = calculateIssuePriorityScore(
      issuePriorityScoringInput,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: expect.any(Number),
      priorityRank: 'MEDIUM',
      scoreBreakdown: {
        frequencyScore: expect.any(Number),
        impactScore: expect.any(Number),
        resolutionDifficultyScore: expect.any(Number),
      },
      colorCode: '#FFFF00',
      calculatedAt: expect.any(String),
    });

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      issuePriorityScoringInput.issueContent
    );

    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      issuePriorityScoringInput.issueContent
    );

    expect(result.priorityRank).toBe('MEDIUM');
    expect(result.colorCode).toBe('#FFFF00');
  });
});