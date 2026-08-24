import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction & Prioritization - API Failure Handling', () => {
  // SCEN-1329
  test('should return cached impact score when TextAnalysisServiceAdapter.assessImpactScore fails', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['サーバーダウン'],
        confidenceScores: [0.95],
      }),
      assessImpactScore: jest.fn().mockRejectedValue(
        new Error('API timeout')
      ),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const mockCachedKeywordDict = {
      getByKeyword: jest.fn().mockReturnValue({
        keywordId: 'kw-001',
        keyword: 'サーバーダウン',
        impactScore: 75,
        cachedAt: '2026-08-19T10:30:00.000Z',
      }),
    };

    const input = {
      teamId: 'team-123',
      startDate: new Date('2026-08-12T00:00:00.000Z'),
      endDate: new Date('2026-08-18T23:59:59.000Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-456',
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
      cachedKeywordDict: mockCachedKeywordDict,
    };

    const result = await extractAndRankIssueKeywords(input);

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('サーバーダウン');
    expect(result.keywords[0].impactScore).toBe(75);
    expect(result.keywords[0].source).toBe('cache');
    expect(result.keywords[0].cachedAt).toBe('2026-08-19T10:30:00.000Z');
    expect(result.keywords[0].rank).toBe(1);
    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBe(7);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      'サーバーダウン'
    );
    expect(mockCachedKeywordDict.getByKeyword).toHaveBeenCalledWith(
      'サーバーダウン'
    );
  });
});