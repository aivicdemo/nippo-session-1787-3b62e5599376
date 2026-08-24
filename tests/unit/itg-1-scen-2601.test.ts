import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type DeploymentParticipant } from '../../src/agents/tx-10-imp-1/types';

describe('TX-10: 朝会報告アプリ初期導入・ユーザー教育', () => {
  // SCEN-2601
  test('初回報告データ品質評価機能 - データ品質スコアが数値でなく文字列のとき評価処理がエラーになる', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['ドキュメント', 'テスト', 'ログイン'],
        frequencies: [2, 1, 3]
      }),
      assessImpactScore: jest.fn().mockResolvedValue('75'),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered',
        userId: 'eng001'
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true })
    };

    const deploymentParticipants: DeploymentParticipant[] = [
      {
        userId: 'eng001',
        role: 'Engineer',
        email: 'engineer001@example.com'
      },
      {
        userId: 'eng002',
        role: 'Engineer',
        email: 'engineer002@example.com'
      },
      {
        userId: 'eng003',
        role: 'Engineer',
        email: 'engineer003@example.com'
      },
      {
        userId: 'eng004',
        role: 'Engineer',
        email: 'engineer004@example.com'
      },
      {
        userId: 'eng005',
        role: 'Engineer',
        email: 'engineer005@example.com'
      },
      {
        userId: 'eng006',
        role: 'Engineer',
        email: 'engineer006@example.com'
      },
      {
        userId: 'eng007',
        role: 'Engineer',
        email: 'engineer007@example.com'
      },
      {
        userId: 'eng008',
        role: 'Engineer',
        email: 'engineer008@example.com'
      },
      {
        userId: 'eng009',
        role: 'Engineer',
        email: 'engineer009@example.com'
      },
      {
        userId: 'eng010',
        role: 'Engineer',
        email: 'engineer010@example.com'
      },
      {
        userId: 'manager001',
        role: 'Manager',
        email: 'manager001@example.com'
      }
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T09:00:00Z'),
      participantList: deploymentParticipants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00'
    };

    await expect(
      runTx10Imp1Agent(input, mockTextAnalysisServiceAdapter, mockNotificationServiceAdapter)
    ).rejects.toThrow(/dataQualityScore is not a number|Expected numeric value, got string/);
  });
});