import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-1530: [error] 課題優先度スコア算出機能 - 抽出課題キーワードが空のとき処理が進まない
  test('extractKeywordsが空配列を返した場合、適切なエラーハンドリングが実行される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム統合の遅延',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(input.issueContent);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: null,
      priorityRank: null,
      scoreBreakdown: null,
      colorCode: null,
      calculatedAt: expect.any(String),
      errorMessage: '課題分析が一時的に利用できません。手動入力をご利用ください',
      fallbackCacheUsed: true,
    });
  });
});