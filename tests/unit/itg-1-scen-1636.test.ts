import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題影響度判定・優先度スコア算出機能', () => {
  // SCEN-1636
  test('チーム波及度スコアが0より小さいとき、処理を中止しエラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システムダウン'],
        frequencies: [1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システムダウンが発生した。全チームの業務が停止している。',
      occurrenceFrequency: 1,
      impactScore: -5,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);

    expect(result).toEqual({
      success: false,
      errorCode: 'ERR_INVALID_IMPACT_SCORE',
      errorMessage: 'チーム波及度スコアが無効な値です。分析を中止しました。',
    });

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});