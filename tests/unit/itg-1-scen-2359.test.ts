import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告集約分析機能 - 月次レポートデータ抽出', () => {
  // SCEN-2359
  test('開始日がnullのとき処理がエラーになる', () => {
    const monthlyExtractionRequest = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined,
    };

    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() => {
      extractMonthlyReportData(
        null as any,
        monthlyExtractionRequest,
        textAnalysisServiceAdapterStub
      );
    }).toThrow(/開始日/);

    expect(textAnalysisServiceAdapterStub.extractKeywords).not.toHaveBeenCalled();
    expect(textAnalysisServiceAdapterStub.assessImpactScore).not.toHaveBeenCalled();
  });
});