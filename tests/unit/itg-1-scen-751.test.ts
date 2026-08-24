import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-751: [error] 課題自動抽出・優先度判定機能 - 集約日報データがundefinedのとき、エラーを返す
  test('集約日報データが undefined のとき、エラーオブジェクトを返し TextAnalysisServiceAdapter を呼び出さない', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    const result = extractAndRankIssueKeywords(
      undefined as any,
      input,
      mockTextAnalysisAdapter
    );

    expect(result).toEqual({
      code: 'INVALID_INPUT',
      message: '集約日報データが必要です',
    });

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});