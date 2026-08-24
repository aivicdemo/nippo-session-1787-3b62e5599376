import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  test('SCEN-2790: 同一出現頻度のキーワード複数件が同じ順序でソートされることを確認', () => {
    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'キーワードA', frequency: 3 },
          { keyword: 'キーワードB', frequency: 3 },
          { keyword: 'キーワードC', frequency: 3 },
        ],
        totalExtracted: 3,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // 1回目の呼び出し
    const result1 = extractAndRankIssueKeywords(input, mockTextAnalysisService);
    const sortOrder1 = result1.keywords.map((k) => k.keyword);

    // 2回目の呼び出し
    const result2 = extractAndRankIssueKeywords(input, mockTextAnalysisService);
    const sortOrder2 = result2.keywords.map((k) => k.keyword);

    // 3回目の呼び出し
    const result3 = extractAndRankIssueKeywords(input, mockTextAnalysisService);
    const sortOrder3 = result3.keywords.map((k) => k.keyword);

    // 期待値: 全実行で同一の順序が維持される
    expect(sortOrder1).toEqual(sortOrder2);
    expect(sortOrder2).toEqual(sortOrder3);

    // 各結果が正しい構造を持つことを確認
    expect(result1.keywords).toHaveLength(3);
    expect(result1.totalKeywordCount).toBe(3);
    expect(result1.analysisperiodDays).toBe(7);

    // ランク付けが正しく行われていることを確認
    result1.keywords.forEach((keyword, index) => {
      expect(keyword.rank).toBe(index + 1);
      expect(keyword.frequency).toBe(3);
    });

    // 同一頻度のキーワードが全て含まれていることを確認
    const keywordNames = result1.keywords.map((k) => k.keyword);
    expect(keywordNames).toContain('キーワードA');
    expect(keywordNames).toContain('キーワードB');
    expect(keywordNames).toContain('キーワードC');
  });
});