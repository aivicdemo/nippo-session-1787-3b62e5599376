import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1 初回報告データ品質評価機能', () => {
  // SCEN-2589
  test('データ品質スコアが未定義のとき評価処理がエラーになる', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['リソース不足'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(undefined),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredAt: new Date('2024-01-15T09:00:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
        scheduledFor: new Date('2024-01-15T08:30:00Z'),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredCount: 10,
        failedCount: 0,
      }),
    };

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T08:00:00Z'),
      participantList: [
        {
          userId: 'eng-001',
          role: 'Engineer',
          email: 'eng001@example.com',
        },
        {
          userId: 'eng-002',
          role: 'Engineer',
          email: 'eng002@example.com',
        },
        {
          userId: 'eng-003',
          role: 'Engineer',
          email: 'eng003@example.com',
        },
        {
          userId: 'eng-004',
          role: 'Engineer',
          email: 'eng004@example.com',
        },
        {
          userId: 'eng-005',
          role: 'Engineer',
          email: 'eng005@example.com',
        },
        {
          userId: 'eng-006',
          role: 'Engineer',
          email: 'eng006@example.com',
        },
        {
          userId: 'eng-007',
          role: 'Engineer',
          email: 'eng007@example.com',
        },
        {
          userId: 'eng-008',
          role: 'Engineer',
          email: 'eng008@example.com',
        },
        {
          userId: 'eng-009',
          role: 'Engineer',
          email: 'eng009@example.com',
        },
        {
          userId: 'eng-010',
          role: 'Engineer',
          email: 'eng010@example.com',
        },
        {
          userId: 'pm-001',
          role: 'ProjectManager',
          email: 'pm001@example.com',
        },
        {
          userId: 'mgr-001',
          role: 'Manager',
          email: 'mgr001@example.com',
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    const testReportData = {
      yesterdayWork: 'タスクA完了',
      todayPlan: 'タスクB開始',
      issues: 'リソース不足',
    };

    await expect(
      runTx10Imp1Agent(input, mockTextAnalysisAdapter, mockNotificationAdapter, testReportData)
    ).rejects.toThrow(/DataQualityScoreUndefinedError/);
  });
});