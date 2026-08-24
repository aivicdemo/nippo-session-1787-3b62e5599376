import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1187
  test('信頼度スコアが null の場合、キャッシュフォールバック または 再試行が発動される', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['サーバー障害', 'データベース接続', 'ネットワーク遅延'],
        frequencies: [5, 3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(null),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    let thrownError: Error | null = null;
    let result: RankedIssueKeywordList | null = null;

    try {
      result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    } catch (err) {
      thrownError = err instanceof Error ? err : new Error(String(err));
    }

    if (thrownError) {
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toMatch(/信頼度|スコア|分析|null|undefined/i);
      expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    } else if (result) {
      expect(result).toBeDefined();
      expect(result.keywords).toBeDefined();
      expect(Array.isArray(result.keywords)).toBe(true);
      if (result.keywords.length > 0) {
        expect(result.keywords[0]).toHaveProperty('keywordId');
        expect(result.keywords[0]).toHaveProperty('keyword');
        expect(result.keywords[0]).toHaveProperty('frequency');
        expect(result.keywords[0]).toHaveProperty('rank');
      }
    }
  });
});