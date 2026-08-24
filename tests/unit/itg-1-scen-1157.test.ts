import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-1157
  test('課題キーワード出現頻度がちょうど信頼度閾値（50%）で有効判定される', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'サーバーダウン',
            frequency: 5,
            totalReports: 10,
            confidenceScore: 50.0,
          },
        ],
        totalKeywordCount: 1,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'サーバーダウン',
      frequency: 5,
      rank: 1,
      validationStatus: 'Valid',
      confidenceScore: 50.0,
    });
    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisPeriodDays).toBe(7);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001',
        startDate: new Date('2024-01-15T00:00:00Z'),
        endDate: new Date('2024-01-21T23:59:59Z'),
        minFrequencyThreshold: 1,
      })
    );
  });
});