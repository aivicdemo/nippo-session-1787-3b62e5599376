import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Impact Score Ranking', () => {
  let mockTextAnalysisAdapter: {
    extractKeywords: jest.Mock;
    assessImpactScore: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
    };
  });

  // SCEN-547
  test('should rank issue keywords by impact score in descending order, placing score 100 before score 99', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-manager-001';

    const mockReportTexts = [
      'Yesterday we fixed keyword A issue affecting database performance, today we will monitor it.',
      'Today we discovered keyword B critical system crash impacting all services.',
    ];

    const mockExtractedKeywords = [
      { keyword: 'keyword A', frequency: 1 },
      { keyword: 'keyword B', frequency: 1 },
    ];

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    mockTextAnalysisAdapter.extractKeywords.mockResolvedValue(mockExtractedKeywords);

    mockTextAnalysisAdapter.assessImpactScore
      .mockResolvedValueOnce(99)
      .mockResolvedValueOnce(100);

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockReportTexts
    );

    expect(result.keywords).toHaveLength(2);
    
    expect(result.keywords[0].keyword).toBe('keyword B');
    expect(result.keywords[0].frequency).toBe(1);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe('keyword A');
    expect(result.keywords[1].frequency).toBe(1);
    expect(result.keywords[1].rank).toBe(2);

    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.stringContaining('keyword A')
    );
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(2);
  });
});