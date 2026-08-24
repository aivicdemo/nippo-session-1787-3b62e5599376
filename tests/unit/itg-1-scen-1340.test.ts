import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1340
  test('should preserve extraction order when keywords have identical frequency', async () => {
    // Arrange: Create mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース', frequency: 3, extractionOrder: 0 },
        { keyword: 'API連携', frequency: 3, extractionOrder: 1 },
        { keyword: 'ユーザー認証', frequency: 3, extractionOrder: 2 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportText =
      'データベース接続エラーが発生。API連携テストも失敗。ユーザー認証機能は完成';

    // Act: Execute the extraction function
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      reportText,
      mockTextAnalysisService
    );

    // Assert: Verify that keywords with identical frequency maintain extraction order
    expect(result.keywords).toHaveLength(3);

    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'データベース',
      frequency: 3,
      rank: 1,
    });

    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'API連携',
      frequency: 3,
      rank: 2,
    });

    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: 'ユーザー認証',
      frequency: 3,
      rank: 3,
    });

    // Verify the keywords appear in the exact extraction order
    expect(result.keywords[0].keyword).toBe('データベース');
    expect(result.keywords[1].keyword).toBe('API連携');
    expect(result.keywords[2].keyword).toBe('ユーザー認証');

    // Verify total keyword count
    expect(result.totalKeywordCount).toBe(3);

    // Verify extraction timestamp is recorded
    expect(result.extractedAt).toBeInstanceOf(Date);

    // Verify analysis period is correctly calculated (7 days)
    expect(result.analysisPeriodDays).toBe(7);
  });
});