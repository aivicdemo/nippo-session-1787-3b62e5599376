import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type DeploymentParticipant } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('tx-10-imp-1: 初回テスト運用判定機能', () => {
  // SCEN-2609: [edge] 初回テスト運用判定機能 - 提出率がちょうど90%のとき本格運用への移行条件を満たす
  test('提出率がちょうど90%のとき、本格運用への移行条件を満たすと判定される', async () => {
    const now = new Date('2024-01-15T09:00:00Z');
    
    const participants: DeploymentParticipant[] = [
      { userId: 'eng001', role: 'Engineer', email: 'eng001@example.com' },
      { userId: 'eng002', role: 'Engineer', email: 'eng002@example.com' },
      { userId: 'eng003', role: 'Engineer', email: 'eng003@example.com' },
      { userId: 'eng004', role: 'Engineer', email: 'eng004@example.com' },
      { userId: 'eng005', role: 'Engineer', email: 'eng005@example.com' },
      { userId: 'eng006', role: 'Engineer', email: 'eng006@example.com' },
      { userId: 'eng007', role: 'Engineer', email: 'eng007@example.com' },
      { userId: 'eng008', role: 'Engineer', email: 'eng008@example.com' },
      { userId: 'eng009', role: 'Engineer', email: 'eng009@example.com' },
      { userId: 'eng010', role: 'Engineer', email: 'eng010@example.com' },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: now,
      participantList: participants,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'schedule-001',
        scheduledTime: new Date('2024-01-16T08:30:00Z'),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        totalNotifications: 10,
        successCount: 9,
        failureCount: 1,
      }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['database_performance', 'api_latency'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScores: [75, 45],
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severities: ['high', 'medium'],
      }),
    };

    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, {
      notificationService: mockNotificationServiceAdapter,
      textAnalysisService: mockTextAnalysisServiceAdapter,
    });

    expect(output.initialReportAnalysis.submissionRate).toBe(90);
    expect(output.onboardingApprovalStatus.status).toBe('READY_FOR_PRODUCTION');
    expect(output.onboardingApprovalStatus.canProceedToProduction).toBe(true);
    expect(output.onboardingApprovalStatus.approvalTimestamp).toEqual(
      expect.any(Date)
    );
  });
});