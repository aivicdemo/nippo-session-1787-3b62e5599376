import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2224: [edge] 朝会報告の入力値検証機能 - 報告項目に改行を含む極端に長いテキスト（業務上の最大規模データ相当）が入力された場合の検証結果が確定する
  test('極端に長いテキスト（65536文字）を含む報告データのバリデーション結果が確定する', () => {
    const textWith65536Chars = 'A\n' + 'B'.repeat(65534);
    
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

    const submitInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Yesterday accomplishment',
      todayPlan: 'Today plan',
      challenges: textWith65536Chars,
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(
      submitInput,
      mockTextAnalysisAdapter,
      mockNotificationAdapter
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'challenges',
          errorCode: 'TEXT_LENGTH_EXCEEDED',
          message: expect.stringMatching(/65536/),
        }),
      ])
    );

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});