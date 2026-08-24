import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/types';

describe('初回テスト運用判定機能', () => {
  // SCEN-2612: [edge] データ品質スコアがちょうど80点のとき本格運用への移行条件を満たす
  test('データ品質スコア80点でシステム判定が本格運用可能と判定されること', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['keyword1', 'keyword2'],
        frequency: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(80),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredAt: new Date('2024-01-15T09:00:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
        successCount: 10,
        failureCount: 0,
      }),
    };

    const testInput: Tx10AgentInput = {
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

    const output: Tx10AgentOutput = await runTx10Imp1Agent(
      testInput,
      mockTextAnalysisAdapter as any,
      mockNotificationAdapter as any
    );

    expect(output.onboardingApprovalStatus.isApproved).toBe(true);
    expect(output.onboardingApprovalStatus.operationalReadinessStatus).toBe(
      'operationally_ready'
    );
    expect(output.initialReportAnalysis.dataQualityScore).toBe(80);
    expect(output.initialReportAnalysis.submissionRate).toBe(100);
    expect(output.initialReportAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(
      85
    );
    expect(output.onboardingApprovalStatus.approvalRecordedAt).toBeDefined();
    expect(
      typeof output.onboardingApprovalStatus.approvalRecordedAt
    ).toBe('object');
  });
});