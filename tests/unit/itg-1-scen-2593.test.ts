import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('初回報告データ品質評価機能 - エラーハンドリング', () => {
  // SCEN-2593
  test('形式統一度が空文字列のとき評価処理がエラーになる', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['環境構築'],
        frequency: 1,
        confidenceScore: 0.85,
        formatUniformityScore: '', // 空文字列を返すようモック設定
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        severity: 'high',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        category: '環境',
      }),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveredAt: new Date('2024-01-15T09:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'notif-123',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    const deploymentParticipants = [
      {
        userId: 'user-001',
        role: 'Engineer',
        email: 'engineer1@example.com',
      },
      {
        userId: 'user-002',
        role: 'Engineer',
        email: 'engineer2@example.com',
      },
      {
        userId: 'user-003',
        role: 'Engineer',
        email: 'engineer3@example.com',
      },
      {
        userId: 'user-004',
        role: 'Engineer',
        email: 'engineer4@example.com',
      },
      {
        userId: 'user-005',
        role: 'Engineer',
        email: 'engineer5@example.com',
      },
      {
        userId: 'user-006',
        role: 'Engineer',
        email: 'engineer6@example.com',
      },
      {
        userId: 'user-007',
        role: 'Engineer',
        email: 'engineer7@example.com',
      },
      {
        userId: 'user-008',
        role: 'Engineer',
        email: 'engineer8@example.com',
      },
      {
        userId: 'user-009',
        role: 'Engineer',
        email: 'engineer9@example.com',
      },
      {
        userId: 'user-010',
        role: 'Engineer',
        email: 'engineer10@example.com',
      },
      {
        userId: 'manager-001',
        role: 'Manager',
        email: 'manager@example.com',
      },
      {
        userId: 'pm-001',
        role: 'ProjectManager',
        email: 'pm@example.com',
      },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T08:00:00Z'),
      participantList: deploymentParticipants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    await expect(
      runTx10Imp1Agent(input, mockTextAnalysisServiceAdapter, mockNotificationServiceAdapter)
    ).rejects.toThrow(/形式統一度/);
  });
});