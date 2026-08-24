import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Extract and Rank Issue Keywords', () => {
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

  // SCEN-537
  it('should return empty array when no keywords are extracted from report text', async () => {
    // Arrange
    const reportText = '昨日やったこと：完了。今日やること：実施予定。課題：なし';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue([]);

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Act
    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert
    expect(result).toEqual({
      keywords: [],
      totalKeywordCount: 0,
      extractedAt: expect.any(Date),
      analysisperiodDays: 7,
    });
    expect(result.keywords).toHaveLength(0);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});