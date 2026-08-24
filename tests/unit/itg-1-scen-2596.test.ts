import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1 orchestrator - runTx10Imp1Agent', () => {
  // SCEN-2596: [error] 初回報告データ品質評価機能 - データ品質スコアが負の数のとき評価処理がエラーになる
  test('should throw ValidationError when assessImpactScore returns negative data quality score', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['issue1', 'issue2'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered',
        userId: 'eng001',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'sched-123',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        delivered: 1,
        failed: 0,
      }),
    };

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T08:00:00Z'),
      participantList: [
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
        {
          userId: 'pm001',
          role: 'ProjectManager',
          email: 'pm001@example.com',
        },
        {
          userId: 'manager001',
          role: 'Manager',
          email: 'manager001@example.com',
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    const callAgent = async () => {
      await runTx10Imp1Agent(input, mockTextAnalysisServiceAdapter, mockNotificationServiceAdapter);
    };

    await expect(callAgent()).rejects.toThrow(/品質スコア/);
  });
});