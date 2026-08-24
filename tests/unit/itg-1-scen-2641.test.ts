import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2641
  test('[error] 初回テスト報告入力検証機能 - 課題キーワードが1つも抽出されていないとき不合格判定となる', async () => {
    // Arrange: TextAnalysisServiceAdapterをスタブ化
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ success: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    const submitDailyReportInput: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'データベース最適化を完了した',
      todayPlan: 'テストコード作成予定',
      challenges: '特に問題なし',
      reportDate: '2024-01-15',
    };

    // Act & Assert: 検証エンジンが課題キーワード抽出結果を確認
    expect(async () => {
      await submitDailyReport(
        submitDailyReportInput,
        mockTextAnalysisService,
        mockNotificationService
      );
    }).rejects.toThrow(/課題キーワード/);

    // Assert: extractKeywordsが呼ばれたことを確認
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledWith(
      submitDailyReportInput.challenges
    );
  });
});