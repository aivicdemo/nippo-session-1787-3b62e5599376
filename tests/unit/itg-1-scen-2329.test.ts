import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次パフォーマンス分析', () => {
  // SCEN-2329: [error] 課題解決速度分析機能 - 指定期間が過去 30 日未満の範囲のとき処理を中止しエラーを返す
  test('分析期間が30日未満のとき ANALYSIS_PERIOD_TOO_SHORT エラーを返し外部API呼び出しは実行されない', () => {
    const today = new Date('2024-01-15T00:00:00Z');
    const analysisStartDate = new Date('2023-12-17T00:00:00Z'); // 本日から29日前
    const analysisEndDate = today; // 本日

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['keyword1', 'keyword2'],
        frequency: [5, 3],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const issueTimeSeriesData = [
      {
        issueId: 'issue-001',
        recordDate: new Date('2023-12-18T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 45,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open' as const,
      },
      {
        issueId: 'issue-001',
        recordDate: new Date('2023-12-20T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'in_progress' as const,
      },
    ];

    const input = {
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: true,
    };

    expect(() =>
      extractMonthlyReportData(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/ANALYSIS_PERIOD_TOO_SHORT/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});