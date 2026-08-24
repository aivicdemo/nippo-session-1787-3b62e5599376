import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-616
  test('should extract and rank issue keywords by frequency in descending order', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'DB接続エラー', frequency: 5 },
        { keyword: 'API遅延', frequency: 3 },
        { keyword: 'メモリリーク', frequency: 7 },
        { keyword: 'ネットワークタイムアウト', frequency: 2 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toHaveLength(4);
    
    // Verify ranking order by frequency (descending)
    expect(result.keywords[0].keyword).toBe('メモリリーク');
    expect(result.keywords[0].frequency).toBe(7);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe('DB接続エラー');
    expect(result.keywords[1].frequency).toBe(5);
    expect(result.keywords[1].rank).toBe(2);

    expect(result.keywords[2].keyword).toBe('API遅延');
    expect(result.keywords[2].frequency).toBe(3);
    expect(result.keywords[2].rank).toBe(3);

    expect(result.keywords[3].keyword).toBe('ネットワークタイムアウト');
    expect(result.keywords[3].frequency).toBe(2);
    expect(result.keywords[3].rank).toBe(4);

    expect(result.totalKeywordCount).toBe(4);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});