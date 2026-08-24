import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 終了日nullエラーハンドリング', () => {
  // SCEN-2360
  test('終了日がnullのとき入力値検証エラーがthrowされ外部APIは呼ばれない', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidRequest = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      aggregationStartDate: '2024-01-01',
      aggregationEndDate: null as unknown as string,
    };

    expect(() =>
      extractMonthlyReportData(invalidRequest, mockTextAnalysisServiceAdapter)
    ).toThrow(/終了日/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});