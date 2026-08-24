import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/types';

describe('Tx10Imp1Agent - 初回報告データ品質評価', () => {
  // SCEN-2590
  test('データ品質スコアが空文字列のとき評価処理がエラーになる', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['テスト課題'],
        frequencies: [1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(''),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    const testInput: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T09:00:00Z'),
      participantList: [
        {
          userId: 'pm001',
          role: 'ProjectManager',
          email: 'pm@example.com',
        },
        {
          userId: 'mgr001',
          role: 'Manager',
          email: 'manager@example.com',
        },
        {
          userId: 'eng001',
          role: 'Engineer',
          email: 'eng1@example.com',
        },
        {
          userId: 'eng002',
          role: 'Engineer',
          email: 'eng2@example.com',
        },
        {
          userId: 'eng003',
          role: 'Engineer',
          email: 'eng3@example.com',
        },
        {
          userId: 'eng004',
          role: 'Engineer',
          email: 'eng4@example.com',
        },
        {
          userId: 'eng005',
          role: 'Engineer',
          email: 'eng5@example.com',
        },
        {
          userId: 'eng006',
          role: 'Engineer',
          email: 'eng6@example.com',
        },
        {
          userId: 'eng007',
          role: 'Engineer',
          email: 'eng7@example.com',
        },
        {
          userId: 'eng008',
          role: 'Engineer',
          email: 'eng8@example.com',
        },
        {
          userId: 'eng009',
          role: 'Engineer',
          email: 'eng9@example.com',
        },
        {
          userId: 'eng010',
          role: 'Engineer',
          email: 'eng10@example.com',
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    await expect(
      runTx10Imp1Agent(testInput, mockTextAnalysisServiceAdapter, mockNotificationServiceAdapter)
    ).rejects.toThrow(/データ品質スコア/);
  });
});