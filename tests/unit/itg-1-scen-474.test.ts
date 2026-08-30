import { searchAndRetrieveReports } from '../../src/logic/report-search-and-retrieval';
import { type SearchAndRetrieveInput, type SearchAndRetrieveOutput, type RankedIssue } from '../../src/logic/report-search-and-retrieval';

describe('Report Search and Retrieval', () => {
  test('SCEN-474: should search reports by date range and keyword filter, returning ranked issues with expected frequency and metadata', () => {
    // Arrange: Set up test data
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-10T23:59:59Z');
    const userId = 'user123';
    const keywordFilter = ['バグ'];
    const currentTime = new Date('2024-01-15T10:30:00Z');

    // Mock report data with 4 occurrences of 'バグ'
    const mockReports = [
      {
        reportId: 'report_001',
        reportDate: new Date('2024-01-02T08:00:00Z'),
        reporterName: 'engineer_a',
        teamName: 'team_alpha',
        content: 'Yesterday: implemented feature X. Today: testing. Issues: バグが見つかった',
        extractedIssues: ['バグ']
      },
      {
        reportId: 'report_002',
        reportDate: new Date('2024-01-04T08:15:00Z'),
        reporterName: 'engineer_b',
        teamName: 'team_beta',
        content: 'Yesterday: fixed issue Y. Today: code review. Issues: バグの修正が必要',
        extractedIssues: ['バグ']
      },
      {
        reportId: 'report_003',
        reportDate: new Date('2024-01-04T09:00:00Z'),
        reporterName: 'engineer_c',
        teamName: 'team_alpha',
        content: 'Yesterday: debugging. Today: optimization. Issues: バグが残っている',
        extractedIssues: ['バグ']
      },
      {
        reportId: 'report_004',
        reportDate: new Date('2024-01-07T08:30:00Z'),
        reporterName: 'engineer_d',
        teamName: 'team_gamma',
        content: 'Yesterday: documentation. Today: deployment. Issues: バグが本番で検出された',
        extractedIssues: ['バグ']
      }
    ];

    // Expected ranked issues after deduplication and frequency ranking
    const expectedRankedIssues: RankedIssue[] = [
      {
        keyword: 'バグ',
        frequency: 4,
        firstReportedDate: new Date('2024-01-02T08:00:00Z'),
        lastReportedDate: new Date('2024-01-07T08:30:00Z'),
        affectedReportCount: 4,
        relatedReportIds: ['report_001', 'report_002', 'report_003', 'report_004']
      }
    ];

    // Mock input
    const searchInput: SearchAndRetrieveInput = {
      dateRange: {
        startDate: '2024-01-01',
        endDate: '2024-01-10'
      },
      keywords: keywordFilter,
      teamIds: undefined,
      reporterIds: undefined
    };

    // Mock the function to return the expected output structure
    // This test verifies that the function correctly processes search criteria
    // and returns ranked issues with proper frequency calculations
    
    // For this test, we're verifying the expected data flow:
    // 1. Authorization check passes for userId
    // 2. Reports are retrieved for the date range
    // 3. Issues are deduplicated and merged
    // 4. Issues are ranked by frequency
    // 5. Results are properly formatted with metadata

    // Expected output based on the 4 matching reports with 'バグ' keyword
    const expectedOutput: SearchAndRetrieveOutput = {
      reports: mockReports.map(report => ({
        reportId: report.reportId,
        reportDate: report.reportDate.toISOString(),
        reporterName: report.reporterName,
        teamName: report.teamName,
        content: report.content,
        extractedIssues: report.extractedIssues
      })),
      issueFrequencyRanking: [
        {
          keyword: 'バグ',
          frequency: 4,
          rank: 1,
          relatedReportIds: ['report_001', 'report_002', 'report_003', 'report_004']
        }
      ],
      totalMatchCount: 4
    };

    // Act: Call the function
    const result = searchAndRetrieveReports(searchInput);

    // Assert: Verify the results
    // (1) Verify that issues array contains at least 1 ranked issue with frequency of 4
    expect(result.issueFrequencyRanking).toBeDefined();
    expect(result.issueFrequencyRanking.length).toBeGreaterThanOrEqual(1);
    expect(result.issueFrequencyRanking[0].frequency).toBe(4);
    expect(result.issueFrequencyRanking[0].keyword).toBe('バグ');

    // (2) Verify that totalMatchCount is 4
    expect(result.totalMatchCount).toBe(4);

    // (3) Verify that reports list contains the expected 4 reports
    expect(result.reports).toBeDefined();
    expect(result.reports.length).toBe(4);

    // (4) Verify the ranking order and structure
    expect(result.issueFrequencyRanking[0].rank).toBe(1);
    expect(result.issueFrequencyRanking[0].relatedReportIds).toEqual(
      ['report_001', 'report_002', 'report_003', 'report_004']
    );

    // (5) Verify all reports contain extracted issues
    result.reports.forEach(report => {
      expect(report.extractedIssues).toBeDefined();
      expect(report.extractedIssues.length).toBeGreaterThan(0);
    });

    // (6) Verify date range filtering
    result.reports.forEach(report => {
      const reportDate = new Date(report.reportDate);
      expect(reportDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(reportDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    // (7) Verify keyword filtering - all extracted issues should contain 'バグ'
    result.reports.forEach(report => {
      expect(report.extractedIssues.some(issue => issue.includes('バグ'))).toBe(true);
    });
  });
});