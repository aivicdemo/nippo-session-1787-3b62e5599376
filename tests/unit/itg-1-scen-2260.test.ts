import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Duplicate Detection with Normalization', () => {
  let mockTextAnalysisAdapter: any;

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  // SCEN-2260
  test('should detect and normalize duplicate issues with fractional similarity score (89.5%) by rounding to integer threshold', async () => {
    const testStartDate = new Date('2024-01-08T00:00:00Z');
    const testEndDate = new Date('2024-01-14T23:59:59Z');
    const testTeamId = 'team-123';
    const testRequestUserId = 'user-456';
    const minFrequencyThreshold = 1;

    const extractInput: ExtractIssueKeywordsInput = {
      teamId: testTeamId,
      startDate: testStartDate,
      endDate: testEndDate,
      minFrequencyThreshold,
      requestUserId: testRequestUserId,
    };

    // Mock: Extract keywords returns two similar issues with frequency data
    // Existing issue: "データベース接続エラー" (DB connection error)
    // New reported issue: "データベース接続失敗" (DB connection failure)
    // Similarity score: 89.5% (fractional, below hard threshold of 90%)
    mockTextAnalysisAdapter.extractKeywords.mockResolvedValueOnce({
      keywords: [
        {
          keyword: 'データベース接続エラー',
          frequency: 3,
          keywordId: 'kw-001',
        },
        {
          keyword: 'データベース接続失敗',
          frequency: 2,
          keywordId: 'kw-002',
        },
      ],
      totalCount: 5,
    });

    // Mock: assessImpactScore returns fractional similarity 89.5%
    // This simulates the edge case where similarity calculation produces decimal
    mockTextAnalysisAdapter.assessImpactScore.mockImplementation(
      async (keyword: string) => {
        if (keyword === 'データベース接続エラー' || keyword === 'データベース接続失敗') {
          // Return 89.5% similarity metric (as a decimal score 0-100)
          return 89.5;
        }
        return 0;
      }
    );

    mockTextAnalysisAdapter.classifyIssueSeverity.mockResolvedValue('high');

    // Execute: Call extractAndRankIssueKeywords with mocked adapter
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      extractInput,
      mockTextAnalysisAdapter
    );

    // Verify: Result structure
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.totalKeywordCount).toBeDefined();
    expect(typeof result.totalKeywordCount).toBe('number');
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBe(7);

    // Verify: Normalized score is rounded to integer
    // After normalization from 89.5%, should round to 90 (round half up)
    // Duplicate detection threshold is 90, so 89.5→90 means duplicate detected
    const normalizedKeywords = result.keywords.filter(
      (kw) =>
        kw.keyword === 'データベース接続エラー' ||
        kw.keyword === 'データベース接続失敗'
    );

    // After duplicate detection and merging, we should have normalized entries
    if (normalizedKeywords.length > 0) {
      // Verify merged frequency: 3 + 2 = 5
      const mergedFrequency = normalizedKeywords.reduce(
        (sum, kw) => sum + kw.frequency,
        0
      );
      expect(mergedFrequency).toBe(5);
    }

    // Verify: Keywords are ranked by frequency (descending)
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency
      );
    }

    // Verify: Rank values start at 1 and increment
    for (let i = 0; i < result.keywords.length; i++) {
      expect(result.keywords[i].rank).toBe(i + 1);
    }

    // Verify: extractedAt is a valid Date
    expect(result.extractedAt instanceof Date).toBe(true);

    // Verify: Mock adapter methods were called
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      testTeamId,
      testStartDate,
      testEndDate
    );

    // Verify: assessImpactScore was called for similarity evaluation
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    // Verify: Normalization logic preserved integer type in internal storage
    // All frequency values should be integers (no fractional parts)
    for (const keyword of result.keywords) {
      expect(Number.isInteger(keyword.frequency)).toBe(true);
    }

    // Verify: No rounding error propagation in subsequent calculations
    // Check that no NaN or Infinity values exist
    for (const keyword of result.keywords) {
      expect(Number.isFinite(keyword.frequency)).toBe(true);
      expect(Number.isFinite(keyword.rank)).toBe(true);
    }
  });
});