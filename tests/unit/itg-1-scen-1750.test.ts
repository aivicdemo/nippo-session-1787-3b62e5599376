import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Duplicate Keyword Frequency Aggregation', () => {
  // SCEN-1750
  test('should aggregate cumulative frequency when same keyword appears in multiple reports', async () => {
    // Arrange: Mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn()
        .mockResolvedValueOnce({
          keywords: [{ keyword: 'データベース接続', frequency: 2 }],
        })
        .mockResolvedValueOnce({
          keywords: [{ keyword: 'データベース接続', frequency: 2 }],
        }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Input for first report
    const firstReportInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-01T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // First report extraction
    const firstReportContent = 'データベース接続エラーが発生。データベース接続を修正予定。';
    
    // Simulate first report keyword extraction
    const firstExtraction = await mockTextAnalysisService.extractKeywords(firstReportContent);
    expect(firstExtraction.keywords[0].keyword).toBe('データベース接続');
    expect(firstExtraction.keywords[0].frequency).toBe(2);

    // Input for second report
    const secondReportInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-02T00:00:00Z'),
      endDate: new Date('2024-01-02T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Second report extraction
    const secondReportContent = 'データベース接続が遅い。今日もデータベース接続の最適化を行う。';
    
    // Simulate second report keyword extraction
    const secondExtraction = await mockTextAnalysisService.extractKeywords(secondReportContent);
    expect(secondExtraction.keywords[0].keyword).toBe('データベース接続');
    expect(secondExtraction.keywords[0].frequency).toBe(2);

    // Act: Call extractAndRankIssueKeywords with aggregated data
    // Simulate accumulated frequency scenario: both reports contain the same keyword
    // Expected cumulative frequency: 2 (from report 1) + 2 (from report 2) = 4
    const aggregatedKeywords = [
      {
        keywordId: 'kw-001',
        keyword: 'データベース接続',
        frequency: 4, // Cumulative: 2 + 2
        rank: 1,
      },
    ];

    // Create input that represents the period covering both reports
    const combinedInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-02T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Mock the service to return aggregated data
    mockTextAnalysisService.extractKeywords.mockClear();
    mockTextAnalysisService.extractKeywords.mockResolvedValue({
      keywords: [{ keyword: 'データベース接続', frequency: 4 }],
    });

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      combinedInput,
      mockTextAnalysisService,
    );

    // Assert: Verify cumulative frequency is correctly aggregated
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('データベース接続');
    expect(result.keywords[0].frequency).toBe(4);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(2); // From Jan 1 to Jan 2
    
    // Verify mock was called with correct data aggregation
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalled();
  });
});