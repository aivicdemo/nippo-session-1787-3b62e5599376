import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import { type MonthlyReportDataset, type TeamReportSummary } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポート生成機能', () => {
  // SCEN-1803: [error] 月次レポート生成機能 - チーム別パフォーマンス指標データが null の状態でレポート生成するとエラーになる
  test('チーム別パフォーマンス指標データが null の場合、INVALID_PERFORMANCE_DATA エラーを返す', () => {
    // Arrange: null を含むチーム別パフォーマンス指標データを準備
    const targetYear = 2024;
    const targetMonth = 3;
    const requestedByUserId = 'user-dept-manager-001';
    
    const teamPerformanceDataWithNull = {
      teamId: 'team-dev-001',
      teamName: 'Development Team A',
      issueResolutionSpeed: null, // null データ
      reportSubmissionRate: 85.5,
      issueRecurrenceRate: 12.3,
      priorityScore: 72
    };

    // Act & Assert: null データで呼び出すとエラーが発生する
    expect(() => {
      extractMonthlyReportData({
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter: undefined,
        // TeamPerformanceMetricsOutput に相当するモック・スタブデータを渡す際に null 値が含まれている状態
        performanceMetrics: {
          teamMetrics: [teamPerformanceDataWithNull],
          aggregationPeriod: {
            startDate: new Date('2024-03-01T00:00:00Z'),
            endDate: new Date('2024-03-31T23:59:59Z'),
            dayCount: 31
          },
          dataQualityScore: 65,
          outlierDetectionResult: {
            detectedOutliers: [],
            normalRangeMin: 50,
            normalRangeMax: 95,
            trendDescription: 'stable'
          }
        }
      });
    }).toThrow(/INVALID_PERFORMANCE_DATA/);
  });
});