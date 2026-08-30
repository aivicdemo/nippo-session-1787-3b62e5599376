import { searchAndRetrieveReports } from '../../src/logic/report-search-and-retrieval';
import type { ReportSearchCondition, RankedReportSearchResult, RankedIssue } from '../../src/logic/report-search-and-retrieval';

describe('report-search-and-retrieval', () => {
  // SCEN-479: [normal] 指定された日付範囲とキーワード条件で日報を検索・抽出し、発生頻度順にランク付けして表示用に整形する。
  test('should search reports by date range and keywords, rank issues by frequency, and return formatted results with deduplication summary', async () => {
    // Prepare test data: past 30 days issue data with varying frequencies
    const searchStartDate = new Date('2024-01-01T00:00:00Z');
    const searchEndDate = new Date('2024-01-30T23:59:59Z');
    const mockSearchCondition: ReportSearchCondition = {
      startDate: searchStartDate,
      endDate: searchEndDate,
      keywordFilter: [],
      userId: 'user-manager-001',
      teamId: 'team-backend-001',
    };

    // Mock retrieved reports with issues
    const mockRetrievedReports = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-15T09:00:00Z'),
        submitterName: 'Alice',
        teamName: 'Backend',
        issueContent: 'デプロイエラーが発生した',
        extractedKeywords: ['デプロイエラー'],
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-16T09:00:00Z'),
        submitterName: 'Bob',
        teamName: 'Backend',
        issueContent: 'デプロイエラーで本番環境が停止',
        extractedKeywords: ['デプロイエラー'],
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-17T09:00:00Z'),
        submitterName: 'Charlie',
        teamName: 'Backend',
        issueContent: 'デプロイ失敗してロールバック実施',
        extractedKeywords: ['デプロイ失敗'],
      },
      {
        reportId: 'report-004',
        reportDate: new Date('2024-01-18T09:00:00Z'),
        submitterName: 'David',
        teamName: 'Backend',
        issueContent: 'デプロイエラーが再発生',
        extractedKeywords: ['デプロイエラー'],
      },
      {
        reportId: 'report-005',
        reportDate: new Date('2024-01-19T09:00:00Z'),
        submitterName: 'Eve',
        teamName: 'Backend',
        issueContent: 'メモリリークでOOMエラー',
        extractedKeywords: ['メモリリーク'],
      },
      {
        reportId: 'report-006',
        reportDate: new Date('2024-01-20T09:00:00Z'),
        submitterName: 'Frank',
        teamName: 'Backend',
        issueContent: 'デプロイ失敗のため手動デプロイ',
        extractedKeywords: ['デプロイ失敗'],
      },
      {
        reportId: 'report-007',
        reportDate: new Date('2024-01-21T09:00:00Z'),
        submitterName: 'Grace',
        teamName: 'Backend',
        issueContent: 'デプロイエラーで再度対応',
        extractedKeywords: ['デプロイエラー'],
      },
      {
        reportId: 'report-008',
        reportDate: new Date('2024-01-22T09:00:00Z'),
        submitterName: 'Henry',
        teamName: 'Backend',
        issueContent: 'デプロイ失敗で本番停止',
        extractedKeywords: ['デプロイ失敗'],
      },
    ];

    // Mock deduplicated and merged issues
    // Expect "デプロイエラー" and "デプロイ失敗" to be merged into one group (similarity 0.8+)
    const mockMergedIssues: RankedIssue[] = [
      {
        issueId: 'merged-issue-001',
        keyword: 'デプロイエラー',
        frequency: 8, // 5 (デプロイエラー) + 3 (デプロイ失敗) merged
        occurrenceCount: 8,
        affectedMemberIds: ['Alice', 'Bob', 'Charlie', 'David', 'Frank', 'Grace', 'Henry'],
        firstOccurrenceDate: new Date('2024-01-15T09:00:00Z'),
        lastOccurrenceDate: new Date('2024-01-22T09:00:00Z'),
        similarityScore: 0.85, // Average similarity within the group
        timeSeriesPattern: '増加傾向',
        rank: 1,
      },
      {
        issueId: 'issue-002',
        keyword: 'メモリリーク',
        frequency: 1,
        occurrenceCount: 1,
        affectedMemberIds: ['Eve'],
        firstOccurrenceDate: new Date('2024-01-19T09:00:00Z'),
        lastOccurrenceDate: new Date('2024-01-19T09:00:00Z'),
        similarityScore: 1.0,
        timeSeriesPattern: '散発的',
        rank: 2,
      },
    ];

    // Mock deduplication summary
    const mockDeduplicationSummary = {
      totalInputIssues: 9,
      mergedCount: 2,
      uniqueIssuesCount: 2,
      duplicateGroupsCount: 1,
    };

    // Mock the internal functions by stubbing searchAndRetrieveReports implementation
    // For this test, we verify the expected output structure directly
    const expectedResult: RankedReportSearchResult = {
      issues: mockMergedIssues,
      totalCount: 2,
      searchExecutedAt: expect.any(Date),
      deduplicationSummary: mockDeduplicationSummary,
    };

    // Call the function - note: actual implementation should use dependency injection
    // For this test, we're verifying the contract structure and calculations
    const result = await searchAndRetrieveReports(mockSearchCondition);

    // Assertion 1: Issues array is sorted by frequency in descending order
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].frequency).toBe(8);
    expect(result.issues[0].rank).toBe(1);
    expect(result.issues[1].frequency).toBe(1);
    expect(result.issues[1].rank).toBe(2);

    // Assertion 2: Each RankedIssue has similarityScore in range 0.0 to 1.0
    result.issues.forEach((issue: RankedIssue) => {
      expect(typeof issue.similarityScore).toBe('number');
      expect(issue.similarityScore).toBeGreaterThanOrEqual(0.0);
      expect(issue.similarityScore).toBeLessThanOrEqual(1.0);
    });

    // Assertion 3: Each RankedIssue has valid timeSeriesPattern
    const validPatterns = ['増加傾向', '減少傾向', '周期的', '散発的'];
    result.issues.forEach((issue: RankedIssue) => {
      expect(validPatterns).toContain(issue.timeSeriesPattern);
    });

    // Assertion 4: totalCount matches the number of unique issues after deduplication
    expect(result.totalCount).toBe(2);

    // Assertion 5: searchExecutedAt is a Date object
    expect(result.searchExecutedAt).toBeInstanceOf(Date);

    // Assertion 6: deduplicationSummary contains correct aggregated counts
    expect(result.deduplicationSummary.totalInputIssues).toBe(9);
    expect(result.deduplicationSummary.mergedCount).toBe(2);
    expect(result.deduplicationSummary.uniqueIssuesCount).toBe(2);
    expect(result.deduplicationSummary.duplicateGroupsCount).toBe(1);

    // Assertion 7: First issue (highest frequency) should have the merged keyword
    expect(result.issues[0].keyword).toBe('デプロイエラー');
    expect(result.issues[0].frequency).toBe(8);
    expect(result.issues[0].similarityScore).toBe(0.85);
    expect(result.issues[0].timeSeriesPattern).toBe('増加傾向');

    // Assertion 8: Second issue should be the low-frequency one
    expect(result.issues[1].keyword).toBe('メモリリーク');
    expect(result.issues[1].frequency).toBe(1);
    expect(result.issues[1].timeSeriesPattern).toBe('散発的');
  });
});