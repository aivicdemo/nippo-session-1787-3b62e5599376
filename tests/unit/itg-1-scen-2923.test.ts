import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  test('SCEN-2923: extractAndRankIssueKeywords returns ranked keywords by frequency in descending order when TextAnalysisServiceAdapter responds successfully', async () => {
    // Arrange: Stub TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'システム障害',
            frequency: 2,
            impactScore: 85,
          },
          {
            keyword: 'DBバックアップ失敗',
            frequency: 1,
            impactScore: 72,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    // Act
    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    // Assert: Verify returned data structure
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('totalKeywordCount');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('analysisperiodDays');

    // Assert: Verify keywords are ranked by frequency in descending order
    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'システム障害',
      frequency: 2,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'DBバックアップ失敗',
      frequency: 1,
      rank: 2,
    });

    // Assert: Verify total keyword count (before filtering)
    expect(result.totalKeywordCount).toBe(2);

    // Assert: Verify analysis period days (from 2024-01-08 to 2024-01-14 = 7 days)
    expect(result.analysisperiodDays).toBe(7);

    // Assert: Verify extractedAt is set to current timestamp
    expect(result.extractedAt).toBeInstanceOf(Date);

    // Assert: Verify TextAnalysisServiceAdapter.extractKeywords was called
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(1);
  });
});