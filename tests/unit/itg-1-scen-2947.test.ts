import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-2947
  test('業務上の最大規模データセット（1000件以上の報告から数百種類のキーワード抽出）を処理した場合、全件が漏れなくランク付けされる', async () => {
    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: generateLargeKeywordDataset(),
        totalKeywordCount: 650,
        extractedAt: new Date('2024-01-15T09:00:00Z'),
        analysisPeriodDays: 7
      })
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:00Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    // Execute
    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisService);

    // Verify all keywords are present and ranked
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBe(650);
    
    // Verify all keywords have rank values within 0-100
    result.keywords.forEach((keyword) => {
      expect(keyword.rank).toBeDefined();
      expect(keyword.rank).not.toBeNull();
      expect(typeof keyword.rank).toBe('number');
      expect(keyword.rank).toBeGreaterThanOrEqual(1);
      expect(keyword.rank).toBeLessThanOrEqual(650);
    });

    // Verify frequency values are present and non-negative
    result.keywords.forEach((keyword) => {
      expect(keyword.frequency).toBeDefined();
      expect(typeof keyword.frequency).toBe('number');
      expect(keyword.frequency).toBeGreaterThanOrEqual(1);
    });

    // Verify totals match
    expect(result.totalKeywordCount).toBe(650);
    expect(result.keywords.length).toBe(result.totalKeywordCount);

    // Verify keywords are sorted by rank (ascending rank = higher frequency)
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].rank).toBeLessThanOrEqual(result.keywords[i + 1].rank);
    }

    // Verify extracted timestamp is recorded
    expect(result.extractedAt).toEqual(new Date('2024-01-15T09:00:00Z'));

    // Verify analysis period is correct
    expect(result.analysisperiodDays).toBe(7);

    // Verify no keywords have null/undefined rank or frequency
    const invalidKeywords = result.keywords.filter(
      (kw) => kw.rank === null || kw.rank === undefined || kw.frequency === null || kw.frequency === undefined
    );
    expect(invalidKeywords.length).toBe(0);
  });
});

/**
 * Generate a large dataset of 650 keywords with varying frequencies
 * to simulate extraction from 1000+ reports
 */
function generateLargeKeywordDataset() {
  const keywords = [];
  const baseFrequencies = [45, 38, 32, 28, 25, 22, 19, 17, 15, 13];
  
  // Generate 650 keywords with realistic frequency distribution
  for (let i = 0; i < 650; i++) {
    const frequencyIndex = i % baseFrequencies.length;
    const baseFreq = baseFrequencies[frequencyIndex];
    const variance = Math.floor(Math.random() * 10) - 5;
    const frequency = Math.max(1, baseFreq + variance);
    
    keywords.push({
      keywordId: `keyword-${String(i + 1).padStart(4, '0')}`,
      keyword: `issue-${String(i + 1).padStart(4, '0')}`,
      frequency: frequency
    });
  }
  
  // Sort by frequency descending to match realistic extraction order
  keywords.sort((a, b) => b.frequency - a.frequency);
  
  return keywords;
}