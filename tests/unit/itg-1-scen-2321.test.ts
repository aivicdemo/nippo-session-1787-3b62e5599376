import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import { type MonthlyReportDataset, type ExtractionValidationResult } from '../../src/logic/monthly-performance-analysis';

describe('monthly-performance-analysis - extractMonthlyReportData', () => {
  // SCEN-2321: [error] 課題解決速度分析機能 - 集約期間の終了日が null のとき処理を中止しエラーを返す
  test('should return INVALID_DATE_RANGE error when aggregationEndDate is null', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result = extractMonthlyReportData(
      {
        aggregationStartDate: new Date('2024-01-01T00:00:00Z'),
        aggregationEndDate: null as unknown as Date,
        teamIds: ['team-001'],
        reportRecords: [
          {
            reportId: 'report-001',
            reportedDate: new Date('2024-01-15T09:00:00Z'),
            teamId: 'team-001',
            issues: [],
          },
        ],
      },
      mockTextAnalysisServiceAdapter
    );

    expect(result).toEqual({
      code: 'INVALID_DATE_RANGE',
      message: '集約期間の終了日が指定されていません',
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});