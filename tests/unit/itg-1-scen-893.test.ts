import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue keyword extraction and frequency ranking', () => {
  // SCEN-893
  test('should extract and rank issue keywords with frequencies when TextAnalysisServiceAdapter responds normally', async () => {
    // Arrange: Prepare stub for TextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['予算承認遅延', 'リソース不足', '予算承認遅延'],
        frequencies: {
          '予算承認遅延': 5,
          'リソース不足': 3,
        },
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportTexts = {
      yesterday: '昨日は API 開発を実施。予算承認遅延により設計レビューが滞っている。',
      today: '今日は フロントエンド統合作業を予定。リソース不足が懸念される。',
      challenges: '予算承認遅延が解決しないと次フェーズに進めない。リソース不足も継続中。',
    };

    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-123';

    // Act: Call extractAndRankIssueKeywords with stub
    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId,
      },
      reportTexts,
      mockTextAnalysisServiceAdapter,
    );

    // Assert: Verify structure and content
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('totalKeywordCount');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('analysisperiodDays');

    // Verify keywords array is not empty and contains RankedIssueKeyword objects
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThan(0);

    // Verify each keyword has required fields
    result.keywords.forEach((keyword) => {
      expect(keyword).toHaveProperty('keywordId');
      expect(keyword).toHaveProperty('keyword');
      expect(keyword).toHaveProperty('frequency');
      expect(keyword).toHaveProperty('rank');

      expect(typeof keyword.keywordId).toBe('string');
      expect(typeof keyword.keyword).toBe('string');
      expect(typeof keyword.frequency).toBe('number');
      expect(typeof keyword.rank).toBe('number');

      // All frequencies must be positive integers
      expect(keyword.frequency).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(keyword.frequency)).toBe(true);
    });

    // Verify keywords are ranked by frequency in descending order
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency,
      );
      expect(result.keywords[i].rank).toBeLessThan(result.keywords[i + 1].rank);
    }

    // Verify totalKeywordCount matches extracted keywords
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(
      result.keywords.filter((k) => k.frequency >= minFrequencyThreshold).length,
    );

    // Verify analysis period days calculation
    const expectedPeriodDays = 7;
    expect(result.analysisperiodDays).toBe(expectedPeriodDays);

    // Verify extractedAt is a valid Date
    expect(result.extractedAt instanceof Date).toBe(true);

    // Verify the stub was called with correct input
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});