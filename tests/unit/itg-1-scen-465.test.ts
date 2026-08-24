import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-465: [edge] 課題自動抽出・優先度判定機能 - 複数の日報に同一の課題キーワードが出現した場合、重複排除されて単一キーワードとしてカウントされる
  test('should deduplicate identical issue keywords across multiple reports and aggregate them as a single entry with combined frequency', async () => {
    // Mock TextAnalysisServiceAdapter
    const mockExtractKeywordsCallCount: { [keywordId: string]: number } = {};
    
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        // Each report contains the keyword "DBのタイムアウト問題"
        // Extracted keywords are returned with occurrence count within each report
        if (text.includes('データベース接続エラー') || text.includes('DBのタイムアウト')) {
          return [
            {
              keywordId: 'kw_001_db_timeout',
              keyword: 'DBのタイムアウト問題',
              frequency: 1,
            },
          ];
        }
        return [];
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        // Track how many times assessImpactScore is called for the same keyword
        const callKey = keyword;
        if (!mockExtractKeywordsCallCount[callKey]) {
          mockExtractKeywordsCallCount[callKey] = 0;
        }
        mockExtractKeywordsCallCount[callKey]++;
        
        return 65; // Moderate impact score
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => {
        return 'medium';
      }),
    };

    // Prepare three reports with identical keyword
    const report_a =
      'データベース接続エラーが発生。DBのタイムアウト問題が深刻です';
    const report_b =
      '昨日のDBのタイムアウト問題が継続中。まだ解決していません';
    const report_c =
      '別チームからもDBのタイムアウト問題の報告あり。共通課題と判断';

    const extractedChallenges = [
      {
        reportId: 'report_a',
        content: report_a,
        timestamp: new Date('2024-01-15T08:00:00Z'),
      },
      {
        reportId: 'report_b',
        content: report_b,
        timestamp: new Date('2024-01-15T08:15:00Z'),
      },
      {
        reportId: 'report_c',
        content: report_c,
        timestamp: new Date('2024-01-15T08:30:00Z'),
      },
    ];

    // Input for extractAndRankIssueKeywords
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team_001',
      startDate: new Date('2024-01-08T00:00:00Z'), // 7 days back
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user_manager_001',
    };

    // Execute the function
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      extractedChallenges,
      mockTextAnalysisServiceAdapter
    );

    // Assertion 1: Verify that identical keywords are deduplicated
    // Only one keyword entry should exist for "DBのタイムアウト問題"
    const dbTimeoutKeyword = result.keywords.find(
      (kw) => kw.keyword === 'DBのタイムアウト問題'
    );
    expect(dbTimeoutKeyword).toBeDefined();

    // Assertion 2: Verify the aggregated frequency is 3
    // (appeared once in each of the three reports)
    expect(dbTimeoutKeyword?.frequency).toBe(3);

    // Assertion 3: Verify total keyword count (before filter) includes only 1 unique keyword
    expect(result.totalKeywordCount).toBe(1);

    // Assertion 4: Verify rank is 1 for the deduplicated keyword
    expect(dbTimeoutKeyword?.rank).toBe(1);

    // Assertion 5: Verify that assessImpactScore was called only once for the deduplicated keyword
    // Count how many times it was called with the deuplicated keyword
    const impactScoreCallsForKeyword = mockTextAnalysisServiceAdapter.assessImpactScore.mock.calls.filter(
      (call) => call[0] === 'DBのタイムアウト問題'
    ).length;
    expect(impactScoreCallsForKeyword).toBe(1);

    // Assertion 6: Verify extractedAt is recorded
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.extractedAt.getTime()).toBeLessThanOrEqual(
      new Date().getTime()
    );

    // Assertion 7: Verify analysisPeriodDays is calculated correctly (from 2024-01-08 to 2024-01-15 = 8 days inclusive)
    expect(result.analysisperiodDays).toBe(8);

    // Assertion 8: Verify the keywords array contains exactly 1 item
    expect(result.keywords).toHaveLength(1);

    // Assertion 9: Verify the keyword object structure
    expect(dbTimeoutKeyword).toEqual(
      expect.objectContaining({
        keywordId: expect.any(String),
        keyword: 'DBのタイムアウト問題',
        frequency: 3,
        rank: 1,
      })
    );
  });
});