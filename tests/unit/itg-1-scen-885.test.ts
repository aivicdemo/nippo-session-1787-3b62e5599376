import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  test('SCEN-885: extractAndRankIssueKeywords processes 500 keywords and ranks them by frequency', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-07T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-manager-001';

    const mockKeywordCount = 500;
    const mockExtractedKeywords = Array.from({ length: mockKeywordCount }, (_, index) => ({
      keywordId: `kw-${String(index + 1).padStart(3, '0')}`,
      keyword: `issue-keyword-${String(index + 1).padStart(3, '0')}`,
      frequency: mockKeywordCount - index,
    }));

    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue(mockExtractedKeywords),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const startTime = Date.now();
    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId,
      },
      mockTextAnalysisService
    );
    const elapsedTimeMs = Date.now() - startTime;

    expect(elapsedTimeMs).toBeLessThan(30000);

    expect(result.keywords).toHaveLength(500);

    expect(result.totalKeywordCount).toBe(500);

    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[0].frequency).toBe(500);
    expect(result.keywords[0].keyword).toBe('issue-keyword-001');

    expect(result.keywords[499].rank).toBe(500);
    expect(result.keywords[499].frequency).toBe(1);
    expect(result.keywords[499].keyword).toBe('issue-keyword-500');

    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency
      );
      expect(result.keywords[i].rank).toBe(i + 1);
    }

    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.getTime()).toBeGreaterThanOrEqual(startTime);
    expect(result.extractedAt.getTime()).toBeLessThanOrEqual(Date.now());

    const expectedAnalysisPeriodDays = 7;
    expect(result.analysisperiodDays).toBe(expectedAnalysisPeriodDays);

    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId,
        startDate,
        endDate,
        requestUserId,
      })
    );

    expect(result.keywords[0].keywordId).toBeDefined();
    expect(result.keywords[0].keywordId).toBeTruthy();
  });
});