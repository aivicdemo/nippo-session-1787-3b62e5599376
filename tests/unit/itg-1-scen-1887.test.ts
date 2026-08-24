import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  let mockTextAnalysisServiceAdapter: {
    extractKeywords: jest.Mock;
    assessImpactScore: jest.Mock;
    classifyIssueSeverity: jest.Mock;
  };

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

  // SCEN-1887
  it('should return empty array when start date equals end date and no report data exists for that date', async () => {
    const startDate = new Date('2026-01-15T00:00:00Z');
    const endDate = new Date('2026-01-15T23:59:59Z');
    const teamId = 'team-001';
    const requestUserId = 'user-001';
    const minFrequencyThreshold = 1;

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue([]);
    mockTextAnalysisServiceAdapter.assessImpactScore.mockResolvedValue(0);

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBe(0);
    expect(result.totalKeywordCount).toBe(0);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(1);
  });
});