import { searchAndRetrieveReports, type ReportSearchCondition, type RankedReportSearchResult } from '../../src/logic/report-search-and-retrieval';

describe('Report Search and Retrieval - searchAndRetrieveReports', () => {
  test('SCEN-413: When extracted issue list is empty, return empty issues array with no deduplication summary message', () => {
    // Arrange
    const searchCondition: ReportSearchCondition = {
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-01-31T23:59:59Z'),
      keywordFilter: [],
      userId: 'user001',
      teamId: 'team001',
    };

    const mockJudgeAccessPermission = jest.fn().mockReturnValue({
      isAuthorized: true,
      visibleDataScope: 'team_all',
    });

    const mockRetrieveReportsByDateRange = jest.fn().mockReturnValue([]);

    const mockDeduplicateAndMergeIssues = jest.fn().mockReturnValue({
      mergedIssues: [],
      deduplicationSummary: {
        totalInputIssues: 0,
        mergedCount: 0,
        uniqueIssuesCount: 0,
        duplicateGroupsCount: 0,
        message: '統合対象の課題がありません',
      },
      normalizedIssueList: [],
    });

    const mockExtractIssueFrequencyRanking = jest.fn().mockReturnValue([]);

    // Act
    const result: RankedReportSearchResult = searchAndRetrieveReports(
      searchCondition,
      mockJudgeAccessPermission,
      mockRetrieveReportsByDateRange,
      mockDeduplicateAndMergeIssues,
      mockExtractIssueFrequencyRanking,
    );

    // Assert
    expect(result.issues).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.searchExecutedAt).toBeInstanceOf(Date);
    expect(result.deduplicationSummary).toEqual({
      totalInputIssues: 0,
      mergedCount: 0,
      uniqueIssuesCount: 0,
      duplicateGroupsCount: 0,
      message: '統合対象の課題がありません',
    });

    expect(mockJudgeAccessPermission).toHaveBeenCalledWith('user001', 'team001');
    expect(mockRetrieveReportsByDateRange).toHaveBeenCalledWith(
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-31T23:59:59Z'),
      'team001',
      [],
    );
    expect(mockDeduplicateAndMergeIssues).toHaveBeenCalledWith([]);
    expect(mockExtractIssueFrequencyRanking).toHaveBeenCalledWith([]);
  });
});