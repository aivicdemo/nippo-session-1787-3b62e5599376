import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1186
  test('抽出キーワードの発生頻度が0のとき処理がエラーになる', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        totalCount: 0,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockLogService = {
      error: jest.fn(),
      info: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService as any,
      mockLogService as any
    );

    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisService.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisService.classifyIssueSeverity).not.toHaveBeenCalled();

    expect(mockLogService.error).toHaveBeenCalledWith(
      expect.stringContaining('出現頻度')
    );

    expect(result).toEqual<RankedIssueKeywordList>({
      keywords: [],
      totalKeywordCount: 0,
      extractedAt: expect.any(Date),
      analysisperiodDays: 7,
    });
  });
});