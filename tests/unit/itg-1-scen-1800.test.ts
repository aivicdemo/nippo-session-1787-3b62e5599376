import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム', () => {
  // SCEN-1800
  test('月次レポート生成機能 - 課題傾向データが空の状態でレポート生成するとエラーになる', () => {
    const targetYear = 2026;
    const targetMonth = 8;
    const requestedByUserId = 'user-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const emptyReportDataset = {
      extractionPeriodStart: '2026-08-01T00:00:00.000Z',
      extractionPeriodEnd: '2026-08-31T23:59:59.999Z',
      totalReportCount: 0,
      reportsByTeam: [],
      dataQualityScore: 0,
      extractedAt: '2026-08-31T23:59:59.999Z',
    };

    const result = extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
      },
      mockTextAnalysisAdapter,
      mockNotificationAdapter,
      emptyReportDataset
    );

    expect(result).toHaveProperty('isValid');
    expect(result.isValid).toBe(false);
    expect(result).toHaveProperty('validationErrors');
    expect(Array.isArray(result.validationErrors)).toBe(true);
    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/課題傾向データが利用可能ではありません/),
      ])
    );
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});