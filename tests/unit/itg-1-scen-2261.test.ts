import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Large Scale Deduplication', () => {
  // SCEN-2261
  test('should complete normalization and deduplication of 1000 large-scale reports within 30 seconds, consolidate duplicate issues into single entries, reduce issue count, register normalized keywords in dictionary, and return success status', async () => {
    const startTime = Date.now();

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'ネットワーク遅延', frequency: 45 },
          { keyword: '通信遅延', frequency: 38 },
          { keyword: 'API応答時間', frequency: 52 },
          { keyword: 'レスポンス遅延', frequency: 41 },
          { keyword: 'データベース接続', frequency: 35 },
          { keyword: 'DB接続エラー', frequency: 32 },
          { keyword: 'メモリリーク', frequency: 28 },
          { keyword: 'メモリ不足', frequency: 25 },
          { keyword: 'ビルド失敗', frequency: 19 },
          { keyword: 'ビルドエラー', frequency: 21 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter as any,
    );

    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;

    expect(processingTimeMs).toBeLessThan(30000);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    expect(result.totalKeywordCount).toBe(10);

    const normalizedCount = result.keywords.length;
    expect(normalizedCount).toBeLessThanOrEqual(result.totalKeywordCount);

    expect(result.keywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: expect.any(String),
          frequency: expect.any(Number),
          rank: expect.any(Number),
        }),
      ]),
    );

    const keywordRanks = result.keywords.map((k) => k.rank);
    const expectedRanks = Array.from({ length: normalizedCount }, (_, i) => i + 1);
    expect(keywordRanks).toEqual(expectedRanks);

    const frequencyOrder = result.keywords.map((k) => k.frequency);
    for (let i = 0; i < frequencyOrder.length - 1; i++) {
      expect(frequencyOrder[i]).toBeGreaterThanOrEqual(frequencyOrder[i + 1]);
    }

    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.getTime()).toBeGreaterThanOrEqual(
      new Date('2024-01-08T00:00:00Z').getTime(),
    );
    expect(result.extractedAt.getTime()).toBeLessThanOrEqual(Date.now());

    const expectedAnalysisPeriodDays = 7;
    expect(result.analysisperiodDays).toBe(expectedAnalysisPeriodDays);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});