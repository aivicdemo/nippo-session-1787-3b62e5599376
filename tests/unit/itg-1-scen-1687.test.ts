import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, TextAnalysisServiceAdapter } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1687
  test('should return error when daily report dataset is null', async () => {
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [],
      teamId: 'team-001',
    };

    const result = await generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisAdapter,
      null
    );

    expect(result).toEqual({
      success: false,
      errorCode: 'ERR_DAILY_REPORT_NULL',
      errorMessage: '日報データが存在しません。分析を中止します。',
    });

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});