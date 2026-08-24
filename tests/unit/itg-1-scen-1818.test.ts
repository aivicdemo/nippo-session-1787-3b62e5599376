import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - 前月の日報データが0件の状態でレポート生成', () => {
  let mockNotificationAdapter: any;
  let mockTextAnalysisAdapter: any;

  beforeEach(() => {
    mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1818
  test('前月の日報データが0件の場合、エラーなく有効なレポートが生成され、外部サービスが呼び出されないこと', () => {
    const targetYear = 2024;
    const targetMonth = 12;
    const requestedByUserId = 'user-001';
    const emptyReportDataset: any[] = [];

    const result = extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
      },
      emptyReportDataset,
      mockNotificationAdapter,
      mockTextAnalysisAdapter
    );

    expect(result).toBeDefined();
    expect(result.totalReportCount).toBe(0);
    expect(result.reportsByTeam).toEqual([]);
    expect(result.dataQualityScore).toBe(100);
    expect(result.extractionPeriodStart).toBe('2024-12-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-12-31T23:59:59Z');
    expect(result.extractedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();

    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.getDeliveryStatus).not.toHaveBeenCalled();
  });
});