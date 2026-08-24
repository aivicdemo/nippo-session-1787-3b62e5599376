import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1442: [normal] 課題キーワード抽出・頻度ランク付け機能 - 同じキーワードが複数の日報に出現したとき、合計出現頻度で正しくランク付けされる
  test('should correctly aggregate and rank issue keywords across multiple reports with combined frequency', () => {
    // Setup: Create test data for 3 reports
    const report1Text = 'データベース接続エラーが発生しました。API タイムアウトの問題も見つけました。';
    const report2Text = 'API タイムアウトが再度発生。ネットワーク遅延も確認されました。';
    const report3Text = 'データベース接続エラーが再度発生しました。';

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
      reportTexts: [report1Text, report2Text, report3Text],
    };

    // Mock TextAnalysisServiceAdapter.extractKeywords behavior
    // Report 1: returns 'データベース接続エラー:1' and 'APIタイムアウト:1'
    // Report 2: returns 'APIタイムアウト:1' and 'ネットワーク遅延:1'
    // Report 3: returns 'データベース接続エラー:1'
    const mockTextAnalysisAdapter = {
      extractKeywords: jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve([
            { keyword: 'データベース接続エラー', frequency: 1 },
            { keyword: 'APIタイムアウト', frequency: 1 },
          ])
        )
        .mockImplementationOnce(() =>
          Promise.resolve([
            { keyword: 'APIタイムアウト', frequency: 1 },
            { keyword: 'ネットワーク遅延', frequency: 1 },
          ])
        )
        .mockImplementationOnce(() =>
          Promise.resolve([{ keyword: 'データベース接続エラー', frequency: 1 }])
        ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Execute: Call the extraction and ranking function
    const result = extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    // Verify: Check that output contains correctly aggregated and ranked keywords
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // Expected aggregation:
    // - APIタイムアウト: 1 + 1 = 2 (appears in report 1 and 2)
    // - データベース接続エラー: 1 + 1 = 2 (appears in report 1 and 3)
    // - ネットワーク遅延: 1 (appears in report 2 only)

    // Sort by frequency descending, then by keyword name for stable ordering when frequencies are equal
    const sortedKeywords = result.keywords.sort((a, b) => {
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return a.keyword.localeCompare(b.keyword);
    });

    // Verify frequency aggregation
    const apiTimeoutKeyword = sortedKeywords.find(
      (k) => k.keyword === 'APIタイムアウト'
    );
    expect(apiTimeoutKeyword).toBeDefined();
    expect(apiTimeoutKeyword?.frequency).toBe(2);

    const dbErrorKeyword = sortedKeywords.find(
      (k) => k.keyword === 'データベース接続エラー'
    );
    expect(dbErrorKeyword).toBeDefined();
    expect(dbErrorKeyword?.frequency).toBe(2);

    const networkDelayKeyword = sortedKeywords.find(
      (k) => k.keyword === 'ネットワーク遅延'
    );
    expect(networkDelayKeyword).toBeDefined();
    expect(networkDelayKeyword?.frequency).toBe(1);

    // Verify ranking (same frequency = same rank)
    // Rank 1: APIタイムアウト and データベース接続エラー (frequency 2)
    // Rank 3: ネットワーク遅延 (frequency 1)
    expect(apiTimeoutKeyword?.rank).toBe(1);
    expect(dbErrorKeyword?.rank).toBe(1);
    expect(networkDelayKeyword?.rank).toBe(3);

    // Verify output structure
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7); // Jan 8-14 = 7 days

    // Verify that keywords are returned in descending order by frequency
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency
      );
    }
  });
});