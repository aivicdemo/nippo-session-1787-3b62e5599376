import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1183
  test('TextAnalysisServiceAdapter.extractKeywords が空配列を返すときエラーハンドリングが動作すること', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    let error: Error | null = null;
    let result: RankedIssueKeywordList | null = null;

    try {
      result = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter,
      );
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
    }

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);

    if (error) {
      expect(error.message).toMatch(/キーワード|分析|空/i);
    } else {
      expect(result).toBeDefined();
      expect(result?.keywords).toEqual([]);
      expect(result?.totalKeywordCount).toBe(0);
      expect(result?.extractedAt).toBeInstanceOf(Date);
      expect(result?.analysisperiodDays).toBeGreaterThanOrEqual(0);
    }
  });
});