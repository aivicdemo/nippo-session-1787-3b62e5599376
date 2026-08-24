import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  let textAnalysisServiceAdapterStub: any;
  let notificationServiceAdapterStub: any;

  beforeEach(() => {
    textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['test_keyword'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(50),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        deliveryStatus: 'delivered',
      }),
    };
  });

  // SCEN-1809
  test('should throw error when execution date is not the first day of month', async () => {
    const executionDateOnSecondDay = new Date('2024-01-02T00:00:00Z');

    await expect(
      extractMonthlyReportData(
        {
          targetYear: 2024,
          targetMonth: 1,
          requestedByUserId: 'user123',
          teamIdFilter: undefined,
        },
        textAnalysisServiceAdapterStub,
        notificationServiceAdapterStub,
        executionDateOnSecondDay
      )
    ).rejects.toThrow(/月初日/);

    expect(textAnalysisServiceAdapterStub.extractKeywords).not.toHaveBeenCalled();
    expect(notificationServiceAdapterStub.sendReminderNotification).not.toHaveBeenCalled();
  });
});