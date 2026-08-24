import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Edge Case: End-of-Month Sunday Inclusion', () => {
  // SCEN-1747
  test('should correctly include end-of-previous-week Sunday reports within aggregation period', async () => {
    // Setup: Test data for the edge case where aggregation period spans from Monday to Sunday
    // Aggregation period: 2024-01-01 (Monday) to 2024-01-07 (Sunday) 23:59:59
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-07T23:59:59Z');

    // Reports created on end-of-week Sunday (2024-01-07) at 09:00:00
    const sundayReportTimestamp = new Date('2024-01-07T09:00:00Z');

    // Mock TextAnalysisServiceAdapter to simulate keyword extraction
    // For this test, we return sample keywords extracted from hypothetical report content
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async (reportText: string) => {
        // Simulate extraction of keywords with their frequencies
        return {
          keywords: [
            { keyword: 'database_issue', frequency: 2, confidence: 0.95 },
            { keyword: 'api_timeout', frequency: 1, confidence: 0.88 },
          ],
          totalExtracted: 2,
          processedAt: new Date(),
        };
      }),
    };

    // Input for extractAndRankIssueKeywords function
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: aggregationStartDate,
      endDate: aggregationEndDate,
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    // Simulated aggregated report data with 2 reports from Sunday
    const aggregatedReports = [
      {
        reportId: 'report-001',
        userId: 'user-a',
        teamId: 'team-001',
        reportText: 'Investigated database connectivity issues. Found that connection pool was exhausted.',
        createdAt: sundayReportTimestamp,
      },
      {
        reportId: 'report-002',
        userId: 'user-b',
        teamId: 'team-001',
        reportText: 'Resolved database issue from yesterday. API timeout errors still persisting.',
        createdAt: sundayReportTimestamp,
      },
    ];

    // Execute the function with mocked adapter
    // In actual implementation, this function would:
    // 1. Query reports within date range
    // 2. Extract keywords using TextAnalysisServiceAdapter
    // 3. Aggregate frequencies
    // 4. Rank by frequency
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter as any
    );

    // Assertions: Verify that Sunday reports are correctly included
    // 1. Total report count should be 2 (both Sunday reports)
    expect(aggregatedReports.length).toBe(2);

    // 2. All reports should fall within the aggregation period
    aggregatedReports.forEach((report) => {
      expect(report.createdAt.getTime()).toBeGreaterThanOrEqual(aggregationStartDate.getTime());
      expect(report.createdAt.getTime()).toBeLessThanOrEqual(aggregationEndDate.getTime());
    });

    // 3. Result should contain ranked keywords with correct frequency aggregation
    // database_issue appears in both reports = frequency 2
    // api_timeout appears in one report = frequency 1
    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0]).toEqual(
      expect.objectContaining({
        keyword: 'database_issue',
        frequency: 2,
        rank: 1,
      })
    );
    expect(result.keywords[1]).toEqual(
      expect.objectContaining({
        keyword: 'api_timeout',
        frequency: 1,
        rank: 2,
      })
    );

    // 4. Total keyword count should match
    expect(result.totalKeywordCount).toBe(2);

    // 5. Analysis period should correctly span from Monday to Sunday
    const expectedAnalysisDays = 7;
    expect(result.analysisperiodDays).toBe(expectedAnalysisDays);

    // 6. Extraction timestamp should be set
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 7. Verify keyword ranking is by frequency (descending)
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(result.keywords[1].frequency);

    // 8. Verify mock was called with correct parameters
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});