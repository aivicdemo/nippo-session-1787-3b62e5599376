import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

// Mock for TextAnalysisServiceAdapter
interface TextAnalysisServiceAdapter {
  extractKeywords: (text: string) => Promise<{ keywords: Array<{ keyword: string; frequency: number }> }>;
}

// Mock for cache (課題キーワード辞書)
interface KeywordCacheEntry {
  keywordId: string;
  keyword: string;
  frequency: number;
  cachedAt: Date;
}

interface KeywordCache {
  get: (key: string) => KeywordCacheEntry | undefined;
  set: (key: string, value: KeywordCacheEntry) => void;
  getAll: () => KeywordCacheEntry[];
}

describe('extractAndRankIssueKeywords - TextAnalysisServiceAdapter failure with cache fallback', () => {
  // SCEN-533: [error] 課題キーワード自動抽出・優先度判定機能 - TextAnalysisServiceAdapterのextractKeywordsが失敗した場合、前回キャッシュから復帰し、新規日報は手動入力に切り替える
  test('should fallback to cache and enable manual input mode when extractKeywords fails after 3 retries', async () => {
    // Setup: TextAnalysisServiceAdapter mock that fails on all attempts
    let callCount = 0;
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async () => {
        callCount++;
        const timeoutErrors = [
          new Error('API timeout (attempt 1)'),
          new Error('API timeout (attempt 2)'),
          new Error('API timeout (attempt 3)'),
        ];
        throw timeoutErrors[callCount - 1];
      }),
    };

    // Setup: Cache with previous analysis result
    const mockKeywordCache: KeywordCache = {
      get: jest.fn((key: string) => {
        if (key === 'team-001') {
          return {
            keywordId: 'kw-bug-001',
            keyword: 'バグ対応',
            frequency: 3,
            cachedAt: new Date('2026-08-18T09:00:00Z'),
          };
        }
        return undefined;
      }),
      set: jest.fn(),
      getAll: jest.fn(() => [
        {
          keywordId: 'kw-bug-001',
          keyword: 'バグ対応',
          frequency: 3,
          cachedAt: new Date('2026-08-18T09:00:00Z'),
        },
      ]),
    };

    // Input: New report text
    const reportText =
      '昨日は〇〇対応を実施。今日はバグ対応を予定。バグ報告が複数件ある';

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2026-08-19T00:00:00Z'),
      endDate: new Date('2026-08-19T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    // Execute with error scenario
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockKeywordCache,
      reportText
    );

    // Verify: extractKeywords was retried 3 times with correct intervals
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    // Verify: Cache fallback was used
    expect(mockKeywordCache.get).toHaveBeenCalledWith('team-001');

    // Verify: Result contains cache keywords, not new extraction
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toEqual({
      keywordId: 'kw-bug-001',
      keyword: 'バグ対応',
      frequency: 3,
      rank: 1,
    });

    // Verify: Total keyword count reflects cache data
    expect(result.totalKeywordCount).toBe(1);

    // Verify: Dashboard message indicates manual input mode
    expect(result).toHaveProperty('fallbackMessage');
    expect(result.fallbackMessage).toMatch(
      /課題分析が一時的に利用できません|手動入力をご利用ください/
    );

    // Verify: Manual input mode flag is enabled
    expect(result).toHaveProperty('manualInputModeEnabled');
    expect(result.manualInputModeEnabled).toBe(true);

    // Verify: Cache source is documented in metadata
    expect(result).toHaveProperty('dataSource');
    expect(result.dataSource).toBe('cache');

    // Verify: Analysis period is from cache timestamp
    expect(result.extractedAt).toEqual(new Date('2026-08-18T09:00:00Z'));

    // Verify: No new keywords from failed extraction attempt
    expect(result.keywords.filter(k => k.keyword !== 'バグ対応')).toHaveLength(0);
  });
});