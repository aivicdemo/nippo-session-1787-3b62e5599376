import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  // SCEN-528
  test('日報テキストがnullの場合、処理を中断してエラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const result = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      null
    );

    expect(result).toEqual({
      error: 'InvalidInput',
      message: '日報テキストがnullまたは空です',
      code: 'ERR_NULL_TEXT',
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});