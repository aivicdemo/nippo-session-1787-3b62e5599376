import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題検索・ランク付け機能', () => {
  // SCEN-1881
  test('検索結果が時系列で昇順に並べられて返される', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T07:00:00Z'),
      endDate: new Date('2024-01-15T11:00:00Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続',
            frequency: 3,
          },
          {
            keyword: 'ネットワークタイムアウト',
            frequency: 2,
          },
          {
            keyword: 'メモリリーク',
            frequency: 1,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: mockTextAnalysisService.extractKeywords,
      assessImpactScore: mockTextAnalysisService.assessImpactScore,
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const result = extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBe(3);

    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[0].keyword).toBe('データベース接続');

    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[1].frequency).toBe(2);
    expect(result.keywords[1].keyword).toBe('ネットワークタイムアウト');

    expect(result.keywords[2].rank).toBe(3);
    expect(result.keywords[2].frequency).toBe(1);
    expect(result.keywords[2].keyword).toBe('メモリリーク');

    for (let i = 1; i < result.keywords.length; i++) {
      expect(result.keywords[i].frequency).toBeLessThanOrEqual(result.keywords[i - 1].frequency);
    }

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBe(4);
  });
});