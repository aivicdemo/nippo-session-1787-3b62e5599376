import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Keyword Deduplication at Threshold Boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-457: [edge] 課題自動抽出・優先度判定機能 - 全10名のメンバーから課題キーワードが抽出される際、出現頻度がちょうど閾値境界値で重複カウントされない
  test('should extract and rank keywords with exact threshold frequency without duplication', async () => {
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const teamId = 'team-001';
    const requestUserId = 'user-pm-001';
    const minFrequencyThreshold = 5;

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'ネットワーク遅延',
            frequency: 5,
            context: 'network_performance',
          },
        ],
        totalExtracted: 5,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(72),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.totalKeywordCount).toBe(5);

    const networkDelayKeyword = result.keywords.find(
      (kw) => kw.keyword === 'ネットワーク遅延'
    );
    expect(networkDelayKeyword).toBeDefined();
    expect(networkDelayKeyword?.frequency).toBe(5);
    expect(networkDelayKeyword?.rank).toBe(1);

    const keywordFrequencies = result.keywords.map((kw) => kw.frequency);
    const uniqueFrequencies = new Set(keywordFrequencies);
    expect(keywordFrequencies.length).toBe(result.keywords.length);

    const networkDelayCount = result.keywords.filter(
      (kw) => kw.keyword === 'ネットワーク遅延'
    ).length;
    expect(networkDelayCount).toBe(1);

    expect(result.extractedAt).toBeDefined();
    expect(result.extractedAt instanceof Date).toBe(true);

    const expectedAnalysisDays = 7;
    expect(result.analysisperiodDays).toBe(expectedAnalysisDays);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith({
      teamId,
      dateRange: { startDate, endDate },
      minFrequency: minFrequencyThreshold,
    });
  });
});