import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-2946
  test('発生頻度計算で端数が生じる場合の丸め処理が正確に適用される', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続エラー',
          count: 7,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-03T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    const analysisPeriodDays = 3;
    const expectedFrequency = Math.round(7 / analysisPeriodDays);

    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);

    const databaseKeyword = result.keywords.find(
      (kw) => kw.keyword === 'データベース接続エラー'
    );

    expect(databaseKeyword).toBeDefined();
    expect(databaseKeyword?.frequency).toBe(expectedFrequency);
    expect(databaseKeyword?.rank).toBe(1);

    expect(result.totalKeywordCount).toBeGreaterThan(0);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(analysisPeriodDays);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001',
        startDate: input.startDate,
        endDate: input.endDate,
      })
    );
  });
});