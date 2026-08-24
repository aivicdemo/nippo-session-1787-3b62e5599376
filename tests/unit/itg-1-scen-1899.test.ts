import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  let mockTextAnalysisAdapter: any;

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1899
  test('should extract and rank issue keywords including those from first day of month when period includes month-start date', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');
    const requestUserId = 'user-manager-001';
    const minFrequencyThreshold = 1;

    const extractIssueKeywordsInput: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const mockExtractedKeywords = [
      {
        keywordId: 'kw-001',
        keyword: 'データベース接続障害',
        frequency: 1,
      },
      {
        keywordId: 'kw-002',
        keyword: 'API認証エラー',
        frequency: 1,
      },
      {
        keywordId: 'kw-003',
        keyword: 'メモリ不足',
        frequency: 1,
      },
      {
        keywordId: 'kw-004',
        keyword: 'UIレイアウト崩れ',
        frequency: 1,
      },
    ];

    mockTextAnalysisAdapter.extractKeywords.mockResolvedValueOnce(
      mockExtractedKeywords
    );

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      extractIssueKeywordsInput,
      mockTextAnalysisAdapter
    );

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId,
        startDate,
        endDate,
      })
    );

    expect(result.keywords).toHaveLength(4);

    expect(result.keywords).toContainEqual(
      expect.objectContaining({
        keyword: 'データベース接続障害',
        frequency: 1,
      })
    );

    expect(result.keywords).toContainEqual(
      expect.objectContaining({
        keyword: 'API認証エラー',
        frequency: 1,
      })
    );

    expect(result.keywords).toContainEqual(
      expect.objectContaining({
        keyword: 'メモリ不足',
        frequency: 1,
      })
    );

    expect(result.keywords).toContainEqual(
      expect.objectContaining({
        keyword: 'UIレイアウト崩れ',
        frequency: 1,
      })
    );

    expect(result.totalKeywordCount).toBe(4);

    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[2].rank).toBe(3);
    expect(result.keywords[3].rank).toBe(4);

    expect(result.analysisperiodDays).toBe(31);

    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});