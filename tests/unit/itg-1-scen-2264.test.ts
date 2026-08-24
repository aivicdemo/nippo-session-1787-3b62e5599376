import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Deduplication and Normalization', () => {
  // SCEN-2264
  test('should deduplicate and normalize identical issue keywords from multiple reports', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-manager-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 3 },
        ],
        totalKeywordCount: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(45),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'データベース接続エラー',
      frequency: 3,
      rank: 1,
    });
    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId,
        startDate,
        endDate,
      })
    );
  });
});

interface ExtractIssueKeywordsInput {
  teamId: string;
  startDate: Date;
  endDate: Date;
  minFrequencyThreshold?: number;
  requestUserId: string;
}