import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking - TextAnalysisServiceAdapter Timeout Handling', () => {
  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1331: assessImpactScore がタイムアウト（30秒超過）したとき処理を中止し例外を発生させる
  test('should throw TimeoutError when assessImpactScore exceeds 30 seconds timeout during keyword ranking', async () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    const extractedKeywordsFromReports = [
      {
        keyword: 'データベース接続エラー',
        frequency: 3,
      },
      {
        keyword: 'ビルド失敗',
        frequency: 2,
      },
    ];

    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue({
      keywords: extractedKeywordsFromReports,
      totalCount: 5,
    });

    mockTextAnalysisServiceAdapter.assessImpactScore.mockImplementation(
      () =>
        new Promise((_, reject) => {
          const timeoutError = new Error('Request timeout after 30000ms');
          timeoutError.name = 'TimeoutError';
          setTimeout(() => reject(timeoutError), 31000);
        })
    );

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).rejects.toThrow(/timeout|Timeout/i);

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});