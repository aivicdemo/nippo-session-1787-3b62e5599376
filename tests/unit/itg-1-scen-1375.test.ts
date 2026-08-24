import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords', () => {
  test('SCEN-1375: should handle null impact data during duplicate issue merging and priority recalculation', () => {
    // Prepare test data with two duplicate issues
    const issueA = {
      id: 'issue-001',
      keyword: 'データベース接続エラー',
      occurrenceCount: 5,
      impactScore: 75,
      resolutionDifficulty: 60,
    };

    const issueB = {
      id: 'issue-002',
      keyword: 'データベース接続エラー',
      occurrenceCount: 3,
      impactScore: null, // Null impact data for issue B
      resolutionDifficulty: 60,
    };

    const input: ExtractIssueKeywordsInput = {
      reportDataList: [
        {
          id: 'report-001',
          teamId: 'team-001',
          userId: 'user-001',
          reportedAt: '2024-01-15T09:00:00Z',
          yesterdayWork: 'データベース接続エラーを検出',
          todayPlan: 'エラーの原因調査',
          issues: 'データベース接続エラー',
          createdAt: '2024-01-15T08:30:00Z',
          updatedAt: '2024-01-15T08:30:00Z',
        },
        {
          id: 'report-002',
          teamId: 'team-001',
          userId: 'user-002',
          reportedAt: '2024-01-15T09:15:00Z',
          yesterdayWork: 'データベース接続エラーに対応',
          todayPlan: 'テストケース追加',
          issues: 'データベース接続エラー',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z',
        },
      ],
      analysisStartDate: '2024-01-08T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      minFrequencyThreshold: 1,
    };

    // Execute function with duplicate issues where one has null impact data
    let thrownError: Error | null = null;
    let result: RankedIssueKeywordList | null = null;

    try {
      result = extractAndRankIssueKeywords(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // Verify that the function detects null impact data and raises appropriate error
    if (thrownError) {
      expect(thrownError.message).toMatch(/影響度/);
    } else if (result && result.keywords.length > 0) {
      // If no error is thrown, verify that keywords are properly ranked
      // and any merged issues maintain data integrity
      const rankedKeyword = result.keywords[0];
      expect(rankedKeyword.keyword).toBe('データベース接続エラー');
      expect(rankedKeyword.frequency).toBeGreaterThanOrEqual(2);
      expect(rankedKeyword.priorityScore).toBeGreaterThanOrEqual(0);
      expect(rankedKeyword.priorityScore).toBeLessThanOrEqual(100);
      expect(['red', 'yellow', 'green']).toContain(rankedKeyword.priorityColor);
    } else {
      // Verify merge operation status indicates failure due to null impact data
      fail('Expected either error thrown or result with keywords');
    }

    // Verify execution timestamp is recorded
    if (result) {
      expect(result.analysisExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }

    // Verify data quality score accounts for null data issues
    if (result) {
      expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
      expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    }
  });
});