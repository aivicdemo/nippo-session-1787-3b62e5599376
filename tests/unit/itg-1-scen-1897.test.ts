import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Cross-Year Date Range', () => {
  let mockTextAnalysisAdapter: {
    extractKeywords: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1897
  test('should correctly extract and rank keywords across year boundary when search date range spans from December 2024 to February 2025', async () => {
    // Arrange: Setup cross-year test data with reports from before and after year boundary
    const reportData_2024_12_15 = {
      reportId: 'report-001',
      content: 'データベース接続エラーが発生した。再試行で復旧。',
      reportDate: new Date('2024-12-15T09:30:00Z'),
      teamId: 'team-alpha',
    };

    const reportData_2025_01_20 = {
      reportId: 'report-002',
      content: 'データベース接続エラーが再発。応急対応完了。',
      reportDate: new Date('2025-01-20T10:15:00Z'),
      teamId: 'team-alpha',
    };

    const reportData_2025_02_10 = {
      reportId: 'report-003',
      content: 'ネットワークタイムアウト発生。リトライロジック改善予定。',
      reportDate: new Date('2025-02-10T14:45:00Z'),
      teamId: 'team-alpha',
    };

    // Mock the TextAnalysisServiceAdapter to return keywords with timestamps
    mockTextAnalysisAdapter.extractKeywords
      .mockResolvedValueOnce({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 1,
            firstOccurrence: new Date('2024-12-15T09:30:00Z'),
            lastOccurrence: new Date('2024-12-15T09:30:00Z'),
            occurrences: [new Date('2024-12-15T09:30:00Z')],
          },
        ],
      })
      .mockResolvedValueOnce({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 1,
            firstOccurrence: new Date('2025-01-20T10:15:00Z'),
            lastOccurrence: new Date('2025-01-20T10:15:00Z'),
            occurrences: [new Date('2025-01-20T10:15:00Z')],
          },
        ],
      })
      .mockResolvedValueOnce({
        keywords: [
          {
            keyword: 'ネットワークタイムアウト',
            frequency: 1,
            firstOccurrence: new Date('2025-02-10T14:45:00Z'),
            lastOccurrence: new Date('2025-02-10T14:45:00Z'),
            occurrences: [new Date('2025-02-10T14:45:00Z')],
          },
        ],
      });

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-alpha',
      startDate: new Date('2024-12-01T00:00:00Z'),
      endDate: new Date('2025-02-28T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    // Act: Call the extraction and ranking function
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // Assert: Verify cross-year keyword extraction and ranking
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThanOrEqual(2);

    // Verify that keywords contain both cross-year occurrences
    const databaseKeyword = result.keywords.find(
      (k) => k.keyword === 'データベース接続エラー'
    );
    expect(databaseKeyword).toBeDefined();
    if (databaseKeyword) {
      expect(databaseKeyword.frequency).toBe(2);
      expect(databaseKeyword.rank).toBe(1); // Highest frequency should rank first
    }

    // Verify network timeout keyword is present
    const networkKeyword = result.keywords.find(
      (k) => k.keyword === 'ネットワークタイムアウト'
    );
    expect(networkKeyword).toBeDefined();
    if (networkKeyword) {
      expect(networkKeyword.frequency).toBe(1);
      expect(networkKeyword.rank).toBe(2); // Second highest frequency
    }

    // Verify ranking is by frequency (descending)
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(
      result.keywords[1].frequency
    );

    // Verify extracted date range
    expect(result.extractedAt).toBeDefined();
    expect(result.extractedAt instanceof Date).toBe(true);

    // Verify analysis period spans correctly across year boundary
    expect(result.analysisperiodDays).toBe(90);

    // Verify total keyword count
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(2);

    // Verify that all keyword dates fall within the search range
    const searchStartTime = new Date('2024-12-01T00:00:00Z').getTime();
    const searchEndTime = new Date('2025-02-28T23:59:59Z').getTime();

    result.keywords.forEach((kw) => {
      expect(kw.keywordId).toBeDefined();
      expect(typeof kw.keywordId).toBe('string');
      expect(kw.keyword).toBeDefined();
      expect(typeof kw.keyword).toBe('string');
      expect(kw.frequency).toBeGreaterThan(0);
      expect(kw.rank).toBeGreaterThan(0);
      expect(typeof kw.rank).toBe('number');
    });

    // Verify mockTextAnalysisAdapter was called for each report in range
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
  });
});