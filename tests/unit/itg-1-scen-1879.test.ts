import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-1879: [normal] 課題検索・ランク付け機能 - 指定された日付範囲内でキーワードにマッチする課題が複数件の場合、発生頻度順にランク付けされて返される
  test('should return keywords ranked by frequency in descending order for reports within date range', async () => {
    const startDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2026-01-31T23:59:59Z');
    const teamId = 'team-001';
    const requestUserId = 'user-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続エラー',
          frequency: 3,
          keywordId: 'kw-db-001',
        },
        {
          keyword: 'UI表示遅延',
          frequency: 2,
          keywordId: 'kw-ui-001',
        },
        {
          keyword: '認証タイムアウト',
          frequency: 1,
          keywordId: 'kw-auth-001',
        },
      ]),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(3);

    expect(result.keywords[0]).toEqual({
      keywordId: 'kw-db-001',
      keyword: 'データベース接続エラー',
      frequency: 3,
      rank: 1,
    });

    expect(result.keywords[1]).toEqual({
      keywordId: 'kw-ui-001',
      keyword: 'UI表示遅延',
      frequency: 2,
      rank: 2,
    });

    expect(result.keywords[2]).toEqual({
      keywordId: 'kw-auth-001',
      keyword: '認証タイムアウト',
      frequency: 1,
      rank: 3,
    });

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(31);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith({
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
    });
  });
});