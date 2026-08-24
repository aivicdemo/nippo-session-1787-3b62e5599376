import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 初回報告データ品質評価機能', () => {
  // SCEN-2585
  test('提出率がnullのとき品質評価処理がValidationErrorをスローする', async () => {
    // 提出率がnullの状態を模擬するため、初期報告分析結果を設定
    const mockInitialReportAnalysisResult = {
      submissionRate: null,
      dataQualityScore: 0,
      formatUniformityScore: 0,
      feedbackItems: []
    };

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue([
        { keyword: 'bug', frequency: 2 },
        { keyword: 'deployment', frequency: 1 }
      ]),
      assessImpactScore: jest.fn().mockReturnValue(75),
      classifyIssueSeverity: jest.fn().mockReturnValue('high')
    };

    // NotificationServiceAdapterをモック化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ success: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' })
    };

    const input = {
      deploymentInitiationTimestamp: new Date('2025-01-15T08:00:00Z'),
      participantList: [
        {
          userId: 'eng001',
          role: 'Engineer',
          email: 'eng001@example.com'
        },
        {
          userId: 'eng002',
          role: 'Engineer',
          email: 'eng002@example.com'
        }
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00'
    };

    const aiClient = {
      callAction01: jest.fn(),
      callAction02: jest.fn(),
      callAction03: jest.fn(),
      callAction04: jest.fn(),
      callAction05: jest.fn(),
      callAction06: jest.fn()
    };

    // 提出率がnullの状態で品質評価処理を実行すると、ValidationErrorが発生することを検証
    await expect(
      runTx10Imp1Agent(
        input,
        aiClient,
        mockTextAnalysisServiceAdapter,
        mockNotificationServiceAdapter,
        mockInitialReportAnalysisResult
      )
    ).rejects.toThrow(/提出率/);
  });
});