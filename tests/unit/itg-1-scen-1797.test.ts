import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - データテーブル null エラーハンドリング', () => {
  // SCEN-1797
  test('日報データテーブルが null の状態でレポート生成するとエラーになる', () => {
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

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    expect(() =>
      extractMonthlyReportData(
        monthlyExtractionRequest,
        null,
        textAnalysisServiceAdapterStub,
        notificationServiceAdapterStub
      )
    ).toThrow(/日報データ/);

    expect(textAnalysisServiceAdapterStub.extractKeywords).not.toHaveBeenCalled();
  });
});