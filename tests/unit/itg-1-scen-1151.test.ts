import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords - TextAnalysisServiceAdapter failure handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1151: [error] 抽出課題データ有効性検証機能 - TextAnalysisServiceAdapter からのキーワード抽出が失敗したとき代替処理が実行される
  test('should fall back to keyword dictionary cache when TextAnalysisServiceAdapter fails after max retries', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(new Error('API timeout')),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockKeywordDictionary = [
      { keywordId: 'kw-001', keyword: 'データベース接続エラー', frequency: 8, rank: 1 },
      { keywordId: 'kw-002', keyword: 'ネットワーク遅延', frequency: 5, rank: 2 },
      { keywordId: 'kw-003', keyword: 'メモリ不足', frequency: 3, rank: 3 },
    ];

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockKeywordDictionary
    );

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
    expect(result).toEqual<RankedIssueKeywordList>({
      keywords: [
        { keywordId: 'kw-001', keyword: 'データベース接続エラー', frequency: 8, rank: 1 },
        { keywordId: 'kw-002', keyword: 'ネットワーク遅延', frequency: 5, rank: 2 },
        { keywordId: 'kw-003', keyword: 'メモリ不足', frequency: 3, rank: 3 },
      ],
      totalKeywordCount: 3,
      extractedAt: expect.any(Date),
      analysisperiodDays: 7,
    });
    expect(result.keywords[0].frequency).toBe(8);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
  });
});