import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-2784
  test('日報テキストから抽出されたキーワード出現頻度がちょうど抽出閾値（3回）で表示対象になる', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'ネットワーク障害',
            frequency: 3,
          },
          {
            keyword: 'ログ確認',
            frequency: 2,
          },
          {
            keyword: 'リソース不足',
            frequency: 1,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 3,
      requestUserId: 'user-123',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'ネットワーク障害',
          frequency: 3,
          rank: 1,
        }),
      ])
    );

    expect(result.keywords.length).toBe(1);
    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);

    const networkFailureKeyword = result.keywords.find(
      (kw) => kw.keyword === 'ネットワーク障害'
    );
    expect(networkFailureKeyword).toBeDefined();
    expect(networkFailureKeyword?.frequency).toBe(3);
    expect(networkFailureKeyword?.rank).toBe(1);
  });
});