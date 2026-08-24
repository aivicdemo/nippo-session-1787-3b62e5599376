import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向分析フロー - 分析対象日報件数が最小閾値より1件少ない場合', () => {
  // SCEN-1696
  test('分析対象日報件数が最小閾値より1件少ない場合、分析をスキップする', async () => {
    const minimumReportThreshold = 5;
    const availableReportCount = 4;

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const requestedByUserId = 'user-123';

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds: ['team-001'],
      requestedByUserId,
    };

    const mockReports = Array.from({ length: availableReportCount }, (_, index) => ({
      reportId: `report-${index + 1}`,
      reportDate: new Date('2024-01-09T09:00:00Z'),
      submittedByUserId: `user-${index + 1}`,
      yesterdayText: 'completed task',
      todayText: 'planned task',
      challengeText: 'issue description',
    }));

    const result = await extractWeeklyReportData(
      extractionRequest,
      mockTextAnalysisAdapter,
      {
        minimumReportThreshold,
        minimumQualityScore: 70,
      }
    );

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();

    expect(result).toEqual({
      weekRange: {
        startDate: weekStartDate,
        endDate: weekEndDate,
      },
      totalReportsExtracted: 0,
      reportsByDate: [],
      extractedChallenges: [],
      dataQualityScore: 0,
      skipReason: '分析対象の日報が不足しているため、分析をスキップしました',
    });
  });
});