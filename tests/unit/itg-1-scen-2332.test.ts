import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次パフォーマンス分析', () => {
  // SCEN-2332: [error] 課題解決速度分析機能 - 指定チーム ID が存在しないとき処理を中止しエラーを返す
  test('存在しないチーム ID を指定した場合、エラーを返し外部サービスを呼び出さない', () => {
    const request: MonthlyExtractionRequest = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: ['team-99999']
    };

    const textAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn()
    };

    let error: Error | null = null;

    try {
      extractMonthlyReportData(
        request,
        textAnalysisServiceAdapter,
        notificationServiceAdapter
      );
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/チームID/);
    expect(textAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(textAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(textAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
    expect(notificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(notificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(notificationServiceAdapter.getDeliveryStatus).not.toHaveBeenCalled();
  });
});