import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次課題傾向分析レポート生成', () => {
  // SCEN-2324: [error] 課題解決速度分析機能 - 指定期間内の日報データ件数が 0 件のとき処理を中止しエラーを返す
  test('指定期間内に日報データが存在しないときエラーを返す', () => {
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

    const emptyReportRecords: any[] = [];

    const analysisInput = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-dept-head-001',
      teamIdFilter: undefined,
      reportRecords: emptyReportRecords,
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
    };

    expect(() =>
      extractMonthlyReportData(analysisInput)
    ).toThrow(/指定期間内に日報データが存在しません/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});