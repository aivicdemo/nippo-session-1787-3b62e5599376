import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyExtractionRequest, WeeklyReportDataset, TextAnalysisServiceAdapter } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - Extract Weekly Report Data', () => {
  // SCEN-1697: [edge] 週次課題傾向分析フロー - 分析対象日報件数が最小閾値より1件多い場合、分析を実行する
  test('should execute analysis and call TextAnalysisServiceAdapter methods when report count exceeds minimum threshold by 1', async () => {
    // Arrange: Minimum threshold from business rules is 5 reports
    const minimumReportThreshold = 5;
    const reportCountExceedingThreshold = minimumReportThreshold + 1; // 6 reports
    
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const teamIds = ['team-001'];
    const requestedByUserId = 'user-manager-001';

    // Create test report data: 6 reports (threshold + 1)
    const testReports = Array.from({ length: reportCountExceedingThreshold }, (_, index) => ({
      reportId: `report-${index + 1}`,
      reportDate: new Date(`2024-01-${8 + index}T09:00:00Z`),
      submittedByUserId: `user-engineer-${index + 1}`,
      yesterdayAccomplishment: `Completed task ${index + 1}`,
      todayPlan: `Plan for task ${index + 1}`,
      challengeItems: [`Challenge A for report ${index + 1}`, `Challenge B for report ${index + 1}`],
    }));

    // Mock TextAnalysisServiceAdapter
    let extractKeywordsCallCount = 0;
    let assessImpactScoreCallCount = 0;
    const mockTextAnalysisAdapter: Partial<TextAnalysisServiceAdapter> = {
      extractKeywords: jest.fn().mockImplementation((_text: string) => {
        extractKeywordsCallCount += 1;
        return {
          keywords: ['performance issue', 'deployment delay'],
          frequency: { 'performance issue': 3, 'deployment delay': 2 },
        };
      }),
      assessImpactScore: jest.fn().mockImplementation((_keyword: string) => {
        assessImpactScoreCallCount += 1;
        return { keyword: _keyword, impactScore: 75 };
      }),
    };

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId,
    };

    // Act: Execute the analysis function with mocked adapter
    const result: WeeklyReportDataset = await extractWeeklyReportData(
      extractionRequest,
      mockTextAnalysisAdapter as TextAnalysisServiceAdapter,
      testReports, // Pass test reports as data source
    );

    // Assert: Verify that analysis was executed
    expect(result).toBeDefined();
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);
    expect(result.totalReportsExtracted).toBe(reportCountExceedingThreshold);
    
    // Verify TextAnalysisServiceAdapter methods were called
    expect(extractKeywordsCallCount).toBeGreaterThan(0);
    expect(assessImpactScoreCallCount).toBeGreaterThan(0);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    // Verify extracted challenges are present in result
    expect(result.extractedChallenges).toBeDefined();
    expect(result.extractedChallenges.length).toBeGreaterThan(0);

    // Verify daily report summaries are aggregated
    expect(result.reportsByDate).toBeDefined();
    expect(result.reportsByDate.length).toBeGreaterThan(0);
    
    // Verify data quality score is within acceptable range (0-100)
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify that no error occurred and analysis was not skipped
    expect(result.totalReportsExtracted).toEqual(reportCountExceedingThreshold);
  });
});