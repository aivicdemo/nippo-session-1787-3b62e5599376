import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyExtractionRequest, MonthlyReportDataset } from '../../src/logic/monthly-performance-analysis';

describe('monthly-performance-analysis', () => {
  // SCEN-1773: [error] 月次レポート生成（データ抽出処理） - 実行ユーザー情報がnullの場合、エラーが発生して処理が中断される
  it('should throw validation error when requestedByUserId is null', async () => {
    const invalidRequest: MonthlyExtractionRequest = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: null as unknown as string,
      teamIdFilter: undefined
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn()
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    expect(() => {
      extractMonthlyReportData(
        invalidRequest,
        mockNotificationAdapter,
        mockTextAnalysisAdapter
      );
    }).toThrow(/ユーザー情報/);
  });
});