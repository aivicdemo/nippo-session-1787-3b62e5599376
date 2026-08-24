import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('課題再発パターン時系列分析 - 0件のケース', () => {
  test('SCEN-1944: 週次期間区分で課題データが0件の場合、空の集計結果が返される', () => {
    // Arrange: テストデータを準備
    const analysisStartDate = new Date('2026-01-01T00:00:00Z');
    const analysisEndDate = new Date('2026-01-07T23:59:59Z');
    const issueTimeSeriesData: never[] = [];

    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Act: 課題再発パターン時系列分析機能を呼び出す
    const result = analyzeBottleneckTrendWithTimeSeries(
      {
        analysisStartDate,
        analysisEndDate,
        issueTimeSeriesData,
        minimumDataPointsThreshold: 7,
        outlierDetectionEnabled: true,
      },
      mockTextAnalysisAdapter,
    );

    // Assert: 空の集計結果オブジェクトが返されることを検証
    expect(result).toEqual({
      issues: [],
      aggregationMetrics: {
        totalDataPoints: 0,
        keywordFrequency: [],
        recurrencePatterns: [],
        teamImpactScore: null,
        analysisStatus: 'success_no_data',
      },
      analysisPeriod: {
        startDate: analysisStartDate,
        endDate: analysisEndDate,
      },
    });

    // 外部サービスが呼び出されないことを検証
    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});