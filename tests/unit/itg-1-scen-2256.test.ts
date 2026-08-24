import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  // SCEN-2256
  test('should distinguish issues with similarity score below threshold as separate keywords', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続がタイムアウトする問題が発生', frequency: 1 },
          { keyword: 'DB接続でタイムアウトが起きている', frequency: 1 },
        ],
        totalKeywordCount: 2,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(50),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
      calculateSimilarityScore: jest.fn()
        .mockResolvedValueOnce(0.84),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual(
      expect.objectContaining({
        keyword: expect.any(String),
        frequency: expect.any(Number),
        rank: 1,
      })
    );
    expect(result.keywords[1]).toEqual(
      expect.objectContaining({
        keyword: expect.any(String),
        frequency: expect.any(Number),
        rank: 2,
      })
    );
    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});