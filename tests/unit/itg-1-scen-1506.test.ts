import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  test('SCEN-1506: Decimal frequencies are correctly rounded and displayed as integers', async () => {
    // Arrange: Setup mock TextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続',
          frequency: 3.7,
        },
        {
          keyword: 'デプロイ遅延',
          frequency: 2.3,
        },
      ]),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act: Execute keyword extraction and ranking logic
    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert: Verify rounding and ranking results
    // Expected: 3.7 rounds to 4, 2.3 rounds to 2
    expect(result.keywords).toHaveLength(2);
    
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'データベース接続',
      frequency: 4,
      rank: 1,
    });
    
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'デプロイ遅延',
      frequency: 2,
      rank: 2,
    });

    // Verify total keyword count (before filtering)
    expect(result.totalKeywordCount).toBe(2);

    // Verify extraction timestamp is recorded
    expect(result.extractedAt).toBeInstanceOf(Date);

    // Verify analysis period calculation
    const expectedAnalysisDays = 7;
    expect(result.analysisperiodDays).toBe(expectedAnalysisDays);

    // Verify all frequencies are integers (no decimals)
    result.keywords.forEach((kw) => {
      expect(Number.isInteger(kw.frequency)).toBe(true);
      expect(kw.frequency).toBeGreaterThanOrEqual(input.minFrequencyThreshold);
    });

    // Verify mock was called with correct input
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001',
        requestUserId: 'user-001',
      })
    );
  });
});