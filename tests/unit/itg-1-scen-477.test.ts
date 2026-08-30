import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { searchAndRetrieveReports } from '../../src/logic/report-search-and-retrieval';

describe('report-search-and-retrieval', () => {
  let mockLogger: jest.Mock;

  beforeEach(() => {
    mockLogger = jest.fn();
  });

  // SCEN-477: 検索対象の日付範囲が90日を超える場合の警告ログ記録と処理の継続
  test('should process search with 91-day range and log warning about processing time', async () => {
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-04-01T23:59:59Z');
    const userId = 'user-001';
    const teamId = 'team-001';
    const keywordFilter = ['バグ', 'パフォーマンス'];

    const mockReportData = [
      {
        reportId: 'report-001',
        reportDate: '2024-01-15',
        submitterName: 'Engineer A',
        teamName: 'Development Team',
        issueContent: 'バグが報告されました',
        extractedKeywords: ['バグ'],
      },
      {
        reportId: 'report-002',
        reportDate: '2024-01-20',
        submitterName: 'Engineer B',
        teamName: 'Development Team',
        issueContent: 'パフォーマンス問題が発生',
        extractedKeywords: ['パフォーマンス'],
      },
      {
        reportId: 'report-003',
        reportDate: '2024-02-10',
        submitterName: 'Engineer A',
        teamName: 'Development Team',
        issueContent: 'バグが再度発生',
        extractedKeywords: ['バグ'],
      },
      {
        reportId: 'report-004',
        reportDate: '2024-03-15',
        submitterName: 'Engineer C',
        teamName: 'Development Team',
        issueContent: 'パフォーマンス最適化が必要',
        extractedKeywords: ['パフォーマンス'],
      },
    ];

    const mockDedupedIssues = {
      mergedIssues: [
        {
          parentIssueId: 'issue-001',
          content: 'バグの重複整合版',
          mergedIssueIds: ['issue-001', 'issue-003'],
          frequency: 2,
          mergedFlag: true,
        },
        {
          parentIssueId: 'issue-002',
          content: 'パフォーマンス問題の重複整合版',
          mergedIssueIds: ['issue-002', 'issue-004'],
          frequency: 2,
          mergedFlag: true,
        },
      ],
      deduplicationSummary: {
        totalInputIssues: 4,
        mergedCount: 2,
        uniqueIssuesCount: 2,
        duplicateGroupsCount: 2,
      },
      normalizedIssueList: [
        {
          issueId: 'issue-001',
          normalizedContent: 'バグの重複整合版',
          sourceReportIds: ['report-001', 'report-003'],
          frequency: 2,
        },
        {
          issueId: 'issue-002',
          normalizedContent: 'パフォーマンス問題の重複整合版',
          sourceReportIds: ['report-002', 'report-004'],
          frequency: 2,
        },
      ],
    };

    const mockRankedIssues = [
      {
        issueId: 'issue-001',
        keyword: 'バグ',
        frequency: 2,
        percentageOfTeam: 50,
        rank: 1,
        impactLevel: 'high',
        affectedTeams: ['Development Team'],
      },
      {
        issueId: 'issue-002',
        keyword: 'パフォーマンス',
        frequency: 2,
        percentageOfTeam: 50,
        rank: 2,
        impactLevel: 'high',
        affectedTeams: ['Development Team'],
      },
    ];

    // Mock the dependencies using jest.mock or passing them as dependencies
    // For this test, we'll assume the function accepts these as parameters or uses a dependency injection pattern

    const searchCondition = {
      startDate,
      endDate,
      keywordFilter,
      userId,
      teamId,
    };

    // Call the function - in real implementation, stubs would be injected
    // This is a simplified test structure; actual implementation may require dependency injection
    const result = await searchAndRetrieveReports(searchCondition, {
      authorizationCheck: jest.fn().mockResolvedValue({ isAuthorized: true }),
      retrieveReportsByDateRange: jest.fn().mockResolvedValue(mockReportData),
      deduplicateAndMergeIssues: jest.fn().mockResolvedValue(mockDedupedIssues),
      rankIssuesByFrequency: jest.fn().mockResolvedValue(mockRankedIssues),
      logWarning: mockLogger,
    });

    // Verify the search was executed and returned correct structure
    expect(result).toBeDefined();
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].rank).toBe(1);
    expect(result.issues[1].rank).toBe(2);
    expect(result.totalCount).toBe(2);
    expect(result.searchExecutedAt).toBeInstanceOf(Date);
    expect(result.deduplicationSummary.totalInputIssues).toBe(4);
    expect(result.deduplicationSummary.mergedCount).toBe(2);
    expect(result.deduplicationSummary.uniqueIssuesCount).toBe(2);
    expect(result.deduplicationSummary.duplicateGroupsCount).toBe(2);

    // Verify that warning was logged for 91-day range exceeding 90-day threshold
    expect(mockLogger).toHaveBeenCalledWith(
      expect.stringContaining('検索範囲が広いため処理に時間がかかる可能性があります')
    );
  });
});