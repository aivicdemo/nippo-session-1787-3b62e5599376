import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Issue Keywords', () => {
  // SCEN-1396: [edge] 重複課題の自動判定と統合機能 - 入力課題データに同一の優先度スコアを持つ複数課題が並ぶ場合、統合判定に影響しない
  test('should not merge multiple issues with identical priority scores if keywords and text content differ', () => {
    // Arrange: Prepare test data with 3 issues having identical priority scores (75 points)
    const reportDataList = [
      {
        id: 'report-001',
        teamId: 'team-001',
        submittedAt: '2024-01-15T09:00:00Z',
        yesterday: 'Completed API integration testing',
        today: 'Deploy to staging environment',
        issues: 'Database connection timeout error during peak hours'
      },
      {
        id: 'report-002',
        teamId: 'team-001',
        submittedAt: '2024-01-15T09:05:00Z',
        yesterday: 'Fixed UI responsive design issues',
        today: 'Merge feature branch to main',
        issues: 'Memory leak detected in Node process'
      },
      {
        id: 'report-003',
        teamId: 'team-001',
        submittedAt: '2024-01-15T09:10:00Z',
        yesterday: 'Reviewed pull requests',
        today: 'Implement cache layer for API',
        issues: 'Authentication token expiration handling incomplete'
      }
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList,
      analysisStartDate: '2024-01-08T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      minFrequencyThreshold: 1
    };

    // Act: Call the function with test data
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(input);

    // Assert: Verify that issues with identical priority scores are NOT merged
    // Expected behavior:
    // - 3 distinct issues extracted: "Database connection timeout", "Memory leak", "Authentication token expiration"
    // - All have priority score of 75 (calculated from frequency 1 + impact 75)
    // - Despite identical scores, they remain as 3 separate issues because keywords/text differ
    // - No merging occurs based on score alone

    expect(result.keywords).toHaveLength(3);
    expect(result.totalIssueCount).toBe(3);

    // Verify each keyword is distinct even though priority scores may be identical
    const keywordTexts = result.keywords.map(k => k.keyword);
    const uniqueKeywords = new Set(keywordTexts);
    expect(uniqueKeywords.size).toBe(3);

    // Verify priority scores are calculated correctly (score of 75 for each)
    result.keywords.forEach(keyword => {
      expect(keyword.priorityScore).toBe(75);
      expect(keyword.frequency).toBe(1);
    });

    // Verify that priority color is assigned based on score (75 = red, high priority)
    result.keywords.forEach(keyword => {
      expect(keyword.priorityColor).toBe('red');
    });

    // Verify analysis metadata
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    expect(result.analysisExecutedAt).toBeTruthy();

    // Verify that no merging occurred by checking distinct keywords persist
    expect(result.keywords.some(k => k.keyword.includes('Database'))).toBe(true);
    expect(result.keywords.some(k => k.keyword.includes('Memory'))).toBe(true);
    expect(result.keywords.some(k => k.keyword.includes('Authentication'))).toBe(true);
  });
});