import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-840
  test('発生頻度データがnullまたはundefinedを含むときエラーになる', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Test 1: frequency が null の場合
    mockTextAnalysisAdapter.extractKeywords.mockResolvedValueOnce([
      { keyword: '課題A', frequency: null },
      { keyword: '課題B', frequency: 2 },
    ]);

    try {
      await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
      fail('null frequency でエラーが発生すべき');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message;
      expect(errorMessage).toMatch(/出現頻度|frequency|不正/i);
    }

    // Test 2: frequency が undefined の場合
    mockTextAnalysisAdapter.extractKeywords.mockResolvedValueOnce([
      { keyword: '課題B', frequency: undefined },
      { keyword: '課題C', frequency: 1 },
    ]);

    try {
      await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
      fail('undefined frequency でエラーが発生すべき');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message;
      expect(errorMessage).toMatch(/出現頻度|frequency|不正|valid/i);
    }
  });
});