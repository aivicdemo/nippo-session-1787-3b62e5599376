import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

// Mock TextAnalysisServiceAdapter
const mockTextAnalysisServiceAdapter = {
  extractKeywords: jest.fn(),
};

describe('extractAndRankIssueKeywords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTextAnalysisServiceAdapter.extractKeywords.mockReset();
  });

  // SCEN-1291: [normal] 課題キーワード自動抽出機能 - 日報テキストから課題キーワードが抽出され、出現頻度でランク付けされる
  test('should extract and rank issue keywords by occurrence frequency in descending order', async () => {
    // Arrange
    const reportText =
      'データベース接続エラーが発生した。ネットワークの遅延が原因と思われる。明日はデータベース接続エラーの根本原因を調査する。ネットワークの最適化も検討中。';

    const extractedKeywords = [
      { keyword: 'データベース接続エラー', frequency: 2 },
      { keyword: 'ネットワーク', frequency: 2 },
      { keyword: '原因', frequency: 1 },
    ];

    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue(extractedKeywords);

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert
    expect(result.keywords).toHaveLength(3);

    // Verify keywords are ranked by frequency in descending order
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'データベース接続エラー',
      frequency: 2,
      rank: 1,
    });

    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'ネットワーク',
      frequency: 2,
      rank: 2,
    });

    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: '原因',
      frequency: 1,
      rank: 3,
    });

    // Verify total keyword count
    expect(result.totalKeywordCount).toBe(3);

    // Verify extraction timestamp is recorded
    expect(result.extractedAt).toBeInstanceOf(Date);

    // Verify analysis period days
    const periodDays = Math.floor(
      (input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    expect(result.analysisperiodDays).toBe(periodDays);

    // Verify keywords are sorted in descending frequency order
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(result.keywords[i + 1].frequency);
    }

    // Verify rank is sequential starting from 1
    result.keywords.forEach((keyword, index) => {
      expect(keyword.rank).toBe(index + 1);
    });

    // Verify adapter was called
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});