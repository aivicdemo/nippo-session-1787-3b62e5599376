import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  test('SCEN-830: extractAndRankIssueKeywords returns consistent results across multiple invocations with same input', () => {
    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        const keywords = [
          { keyword: 'データベース接続エラー', frequency: 3 },
          { keyword: 'APIレスポンス遅延', frequency: 2 },
          { keyword: 'メモリ不足', frequency: 1 }
        ];
        return Promise.resolve(keywords);
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'データベース接続エラー': 85,
          'APIレスポンス遅延': 60,
          'メモリ不足': 45
        };
        return Promise.resolve(scoreMap[keyword] || 0);
      })
    };

    // Test dataset with required report sections
    const reportDataSet = {
      yesterday: 'Yesterday completed migration to new database, but encountered データベース接続エラー during testing',
      today: 'Today will run integration tests and monitor APIレスポンス遅延 issues',
      challenges: 'Facing メモリ不足 on production servers. Also dealing with データベース接続エラー again and APIレスポンス遅延 in API calls'
    };

    const combinedText = `${reportDataSet.yesterday} ${reportDataSet.today} ${reportDataSet.challenges}`;

    // First invocation
    const firstResult = extractAndRankIssueKeywords(
      combinedText,
      new Date('2024-01-15T09:00:00Z'),
      new Date('2024-01-22T09:00:00Z'),
      1,
      mockTextAnalysisAdapter
    );

    // Second invocation with same input
    const secondResult = extractAndRankIssueKeywords(
      combinedText,
      new Date('2024-01-15T09:00:00Z'),
      new Date('2024-01-22T09:00:00Z'),
      1,
      mockTextAnalysisAdapter
    );

    // Third invocation with same input
    const thirdResult = extractAndRankIssueKeywords(
      combinedText,
      new Date('2024-01-15T09:00:00Z'),
      new Date('2024-01-22T09:00:00Z'),
      1,
      mockTextAnalysisAdapter
    );

    // Verify first result structure
    expect(firstResult).toHaveProperty('keywords');
    expect(firstResult).toHaveProperty('totalKeywordCount');
    expect(firstResult).toHaveProperty('extractedAt');
    expect(firstResult).toHaveProperty('analysisperiodDays');

    // Verify keywords array contains expected items with rank
    expect(firstResult.keywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keywordId: expect.any(String),
          keyword: expect.any(String),
          frequency: expect.any(Number),
          rank: expect.any(Number)
        })
      ])
    );

    // Verify exact consistency between invocations
    expect(secondResult.keywords).toHaveLength(firstResult.keywords.length);
    expect(thirdResult.keywords).toHaveLength(firstResult.keywords.length);

    // Verify keyword content matches across all three invocations
    firstResult.keywords.forEach((firstKeyword, index) => {
      const secondKeyword = secondResult.keywords[index];
      const thirdKeyword = thirdResult.keywords[index];

      expect(secondKeyword.keywordId).toBe(firstKeyword.keywordId);
      expect(secondKeyword.keyword).toBe(firstKeyword.keyword);
      expect(secondKeyword.frequency).toBe(firstKeyword.frequency);
      expect(secondKeyword.rank).toBe(firstKeyword.rank);

      expect(thirdKeyword.keywordId).toBe(firstKeyword.keywordId);
      expect(thirdKeyword.keyword).toBe(firstKeyword.keyword);
      expect(thirdKeyword.frequency).toBe(firstKeyword.frequency);
      expect(thirdKeyword.rank).toBe(firstKeyword.rank);
    });

    // Verify total keyword count is consistent
    expect(secondResult.totalKeywordCount).toBe(firstResult.totalKeywordCount);
    expect(thirdResult.totalKeywordCount).toBe(firstResult.totalKeywordCount);

    // Verify analysis period days is consistent (7 days between 2024-01-15 and 2024-01-22)
    expect(secondResult.analysisperiodDays).toBe(firstResult.analysisperiodDays);
    expect(thirdResult.analysisperiodDays).toBe(firstResult.analysisperiodDays);
    expect(firstResult.analysisperiodDays).toBe(7);

    // Verify extractedAt timestamps are all present and valid ISO 8601 format
    expect(firstResult.extractedAt).toBeInstanceOf(Date);
    expect(secondResult.extractedAt).toBeInstanceOf(Date);
    expect(thirdResult.extractedAt).toBeInstanceOf(Date);

    // Verify ranking is in descending order of frequency
    for (let i = 0; i < firstResult.keywords.length - 1; i++) {
      expect(firstResult.keywords[i].frequency).toBeGreaterThanOrEqual(
        firstResult.keywords[i + 1].frequency
      );
      expect(firstResult.keywords[i].rank).toBeLessThan(
        firstResult.keywords[i + 1].rank
      );
    }

    // Verify all keywords have unique ranks starting from 1
    const firstRanks = firstResult.keywords.map(kw => kw.rank);
    const uniqueRanks = new Set(firstRanks);
    expect(uniqueRanks.size).toBe(firstRanks.length);
    expect(Math.min(...firstRanks)).toBe(1);
  });
});