import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-543: [edge] 課題キーワード自動抽出・優先度判定機能 - 発生頻度がちょうど閾値（例：3回）と一致する課題キーワードが正しくランク付けされる
  test('should rank keywords with frequency exactly at threshold (3) correctly between lower (2) and higher (4) frequencies', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keywordId: 'kw-001',
          keyword: 'データベース接続エラー',
          frequency: 3,
        },
        {
          keywordId: 'kw-002',
          keyword: 'ネットワーク遅延',
          frequency: 2,
        },
        {
          keywordId: 'kw-003',
          keyword: 'メモリ不足',
          frequency: 4,
        },
      ]),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        const scoreMap: { [key: string]: number } = {
          'データベース接続エラー': 65,
          'ネットワーク遅延': 50,
          'メモリ不足': 75,
        };
        return Promise.resolve(scoreMap[keyword] || 0);
      }),
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
      mockTextAnalysisService,
    );

    // Verify that keywords are ranked by frequency in descending order
    expect(result.keywords).toHaveLength(3);

    // Keywords should be sorted by frequency descending: 4 > 3 > 2
    expect(result.keywords[0].keyword).toBe('メモリ不足');
    expect(result.keywords[0].frequency).toBe(4);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe('データベース接続エラー');
    expect(result.keywords[1].frequency).toBe(3);
    expect(result.keywords[1].rank).toBe(2);

    expect(result.keywords[2].keyword).toBe('ネットワーク遅延');
    expect(result.keywords[2].frequency).toBe(2);
    expect(result.keywords[2].rank).toBe(3);

    // Verify total keyword count
    expect(result.totalKeywordCount).toBe(3);

    // Verify extraction timestamp is recorded
    expect(result.extractedAt).toBeInstanceOf(Date);

    // Verify analysis period days calculation
    const periodDays = Math.ceil(
      (new Date('2024-01-14T23:59:59Z').getTime() -
        new Date('2024-01-08T00:00:00Z').getTime()) /
        (1000 * 60 * 60 * 24),
    );
    expect(result.analysisperiodDays).toBe(periodDays);

    // Verify stub was called with correct parameters
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledWith(
      input.teamId,
      input.startDate,
      input.endDate,
    );

    // Verify impact score assessment was called for each keyword
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledWith(
      'データベース接続エラー',
    );
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledWith(
      'ネットワーク遅延',
    );
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledWith(
      'メモリ不足',
    );
  });
});