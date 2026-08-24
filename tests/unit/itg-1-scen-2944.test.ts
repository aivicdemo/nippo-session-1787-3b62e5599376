import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  test('SCEN-2944: Multiple keywords with identical frequency are all preserved with equal rank', async () => {
    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'API障害', frequency: 3 },
        { keyword: 'ネットワーク遅延', frequency: 3 },
        { keyword: 'デプロイ失敗', frequency: 3 }
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    const reportText = '本日API障害が発生した。ネットワーク遅延も同時に起きた。デプロイ失敗も重なった。';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-07T23:59:59Z');

    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold: 1,
        requestUserId: 'user-001'
      },
      mockTextAnalysisAdapter
    );

    // Verify all three keywords are present
    expect(result.keywords).toHaveLength(3);

    // Verify each keyword has the correct properties
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'API障害',
      frequency: 3,
      rank: 1
    });

    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'ネットワーク遅延',
      frequency: 3,
      rank: 1
    });

    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: 'デプロイ失敗',
      frequency: 3,
      rank: 1
    });

    // Verify all keywords have rank 1 (indicating equal priority)
    expect(result.keywords.every(kw => kw.rank === 1)).toBe(true);

    // Verify totalKeywordCount
    expect(result.totalKeywordCount).toBe(3);

    // Verify extractedAt is a Date
    expect(result.extractedAt).toBeInstanceOf(Date);

    // Verify analysisPeriodDays (from Jan 1 to Jan 7 is 7 days)
    expect(result.analysisperiodDays).toBe(7);
  });
});