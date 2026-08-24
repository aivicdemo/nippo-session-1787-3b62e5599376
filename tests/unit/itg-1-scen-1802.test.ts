import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Extract Monthly Report Data', () => {
  // SCEN-1802: [error] 月次レポート生成機能 - ボトルネック推移データが空の状態でレポート生成するとエラーになる
  test('should throw error when bottleneck trend data is empty', () => {
    // Input: empty bottleneck trend data
    const monthlyExtractionRequest = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined,
    };

    const emptyBottleneckTrendData: Array<{
      issueId: string;
      bottleneckSeverityRank: 'critical' | 'high' | 'medium' | 'low';
      bottleneckSeverityScore: number;
      improvementTrend: 'improving' | 'stable' | 'deteriorating';
      averageResolutionDays: number;
      peakOccurrenceDate: Date;
      timeSeriesTrendData: Array<{
        date: Date;
        occurrenceCount: number;
        impactScore: number;
        resolutionRate: number;
      }>;
    }> = [];

    // Mock TextAnalysisServiceAdapter
    const textAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequency: {},
      }),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    // Mock NotificationServiceAdapter
    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveryId: 'notif-001',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'success',
      }),
    };

    // Execute function call
    expect(() =>
      extractMonthlyReportData(
        monthlyExtractionRequest,
        emptyBottleneckTrendData,
        textAnalysisServiceAdapter,
        notificationServiceAdapter
      )
    ).toThrow(/ボトルネック推移データ/);
  });
});