import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Deduplication and Normalization', () => {
  // SCEN-2257: [edge] 課題の重複検出と正規化 - 課題テキストの類似度スコアが閾値直上（例：86%）の場合、同一課題として正規化される

  let mockTextAnalysisServiceAdapter: jest.Mocked<any>;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
      calculateSimilarity: jest.fn(),
    };
  });

  test('should normalize similar issues with similarity score at threshold boundary (86%)', async () => {
    // Setup: TextAnalysisServiceAdapter mock with similarity calculation
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-07T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-pm-001';

    // Mock issue extraction with two similar issue texts
    const issue1Text = 'データベース接続エラーが発生している';
    const issue2Text = 'DB接続でエラーが起こっている';

    // Configure mock to extract two similar keywords with similarity at 86%
    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue([
      {
        keyword: issue1Text,
        frequency: 3,
        keywordId: 'kw-001',
        occurrenceCount: 3,
      },
      {
        keyword: issue2Text,
        frequency: 2,
        keywordId: 'kw-002',
        occurrenceCount: 2,
      },
    ]);

    // Mock similarity calculation to return 86% (threshold boundary)
    mockTextAnalysisServiceAdapter.calculateSimilarity.mockImplementation(
      (text1: string, text2: string) => {
        if (
          (text1 === issue1Text && text2 === issue2Text) ||
          (text1 === issue2Text && text2 === issue1Text)
        ) {
          return 0.86; // 86% similarity at threshold
        }
        return 0;
      }
    );

    // Mock impact score assessment
    mockTextAnalysisServiceAdapter.assessImpactScore.mockResolvedValue(45);

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Execute: Call extractAndRankIssueKeywords with mock adapter
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Verify: Check normalization results
    // After normalization, similar issues should be merged into one
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBe(1); // Two similar issues merged into one

    const normalizedKeyword = result.keywords[0];

    // Verify the normalized keyword preserves the master issue text
    expect(normalizedKeyword.keyword).toBe(issue1Text);

    // Verify merged frequency is the sum of both original frequencies
    expect(normalizedKeyword.frequency).toBe(5); // 3 + 2 = 5

    // Verify rank is 1 (highest)
    expect(normalizedKeyword.rank).toBe(1);

    // Verify keyword ID is assigned
    expect(normalizedKeyword.keywordId).toBeDefined();

    // Verify extraction metadata
    expect(result.totalKeywordCount).toBe(2); // Original count before deduplication
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    // Verify mock was called with correct parameters
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId,
        startDate,
        endDate,
      })
    );

    expect(mockTextAnalysisServiceAdapter.calculateSimilarity).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String)
    );
  });
});