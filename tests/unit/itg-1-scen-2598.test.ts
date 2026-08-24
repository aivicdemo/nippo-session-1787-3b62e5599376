import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1 agent: 初回報告データ品質評価', () => {
  // SCEN-2598: [error] 初回報告データ品質評価機能 - 形式統一度が負の数のとき評価処理がエラーになる
  test('形式統一度が負の数のとき業務例外エラーをスロー', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const participantList = [
      {
        userId: 'pm001',
        role: 'ProjectManager',
        email: 'pm001@example.com',
      },
      {
        userId: 'mgr001',
        role: 'Manager',
        email: 'mgr001@example.com',
      },
      {
        userId: 'eng001',
        role: 'Engineer',
        email: 'eng001@example.com',
      },
      {
        userId: 'eng002',
        role: 'Engineer',
        email: 'eng002@example.com',
      },
      {
        userId: 'eng003',
        role: 'Engineer',
        email: 'eng003@example.com',
      },
      {
        userId: 'eng004',
        role: 'Engineer',
        email: 'eng004@example.com',
      },
      {
        userId: 'eng005',
        role: 'Engineer',
        email: 'eng005@example.com',
      },
      {
        userId: 'eng006',
        role: 'Engineer',
        email: 'eng006@example.com',
      },
      {
        userId: 'eng007',
        role: 'Engineer',
        email: 'eng007@example.com',
      },
      {
        userId: 'eng008',
        role: 'Engineer',
        email: 'eng008@example.com',
      },
      {
        userId: 'eng009',
        role: 'Engineer',
        email: 'eng009@example.com',
      },
      {
        userId: 'eng010',
        role: 'Engineer',
        email: 'eng010@example.com',
      },
    ];
    const preparationDaysRequired = 5;
    const reportingDeadlineTime = '09:00';

    const stubAiClient = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database', frequency: 2, confidence: 0.85 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
    };

    const stubNotificationService = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ status: 'success' }),
      scheduleNotification: jest
        .fn()
        .mockResolvedValue({ scheduledId: 'sched001' }),
      getDeliveryStatus: jest
        .fn()
        .mockResolvedValue({ deliveryStatus: 'sent' }),
    };

    const input = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    await expect(
      runTx10Imp1Agent(input, stubAiClient, stubNotificationService)
    ).rejects.toThrow(/形式統一度は0以上100以下の値である必要があります/);
  });
});