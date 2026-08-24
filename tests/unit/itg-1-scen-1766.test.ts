import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-1766
  test('should throw validation error when extractionPeriodEnd is null', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const inputData = {
      extractionPeriodStart: '2026-01-01T00:00:00Z',
      extractionPeriodEnd: null,
      targetYear: 2026,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined,
    };

    expect(() =>
      extractMonthlyReportData(
        inputData,
        mockTextAnalysisAdapter,
        mockNotificationAdapter
      )
    ).toThrow(/抽出終了日時|extractionPeriodEnd|required/i);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.getDeliveryStatus).not.toHaveBeenCalled();
  });
});