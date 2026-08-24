import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1902
  test('検索条件に重複するキーワードが指定された場合、重複を除外して検索結果が生成される', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { word: 'データベース接続', frequency: 5 },
          { word: 'API統合', frequency: 3 },
          { word: 'データベース接続', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'データベース接続',
      frequency: 7,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'API統合',
      frequency: 3,
      rank: 2,
    });
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(31);
  });
});