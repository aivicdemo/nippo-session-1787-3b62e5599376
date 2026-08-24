import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次パフォーマンス分析', () => {
  // SCEN-2331
  test('分析対象チームIDが空文字列のとき処理を中止しエラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const monthlyExtractionRequest = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: [''],
    };

    const result = extractMonthlyReportData(
      monthlyExtractionRequest,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toEqual({
      isValid: false,
      validationErrors: ['分析対象チームIDが指定されていません'],
      errorCode: 'INVALID_TEAM_ID',
      statusCode: 400,
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});