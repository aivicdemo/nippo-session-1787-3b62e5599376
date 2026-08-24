import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  InitialReportAnalysisResult,
} from '../../src/agents/tx-10-imp-1/types';

describe('朝会報告管理システム - Tx10Imp1Agent', () => {
  // SCEN-2624: [normal] 初回テスト報告の形式・品質判定 - 初回テスト報告が運用ルール適合の場合、合格と判定される
  test('should judge initial test report as passed when all operational rules are satisfied', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['レビュー待ち', '承認'],
        frequency: [3, 3],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: '高',
      }),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'schedule-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        deliveryStatus: 'success',
      }),
    };

    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportingDeadlineTime = '09:00';

    const participant_engineer_01: DeploymentParticipant = {
      userId: 'engineer-001',
      role: 'Engineer',
      email: 'engineer001@example.com',
    };

    const participant_manager: DeploymentParticipant = {
      userId: 'manager-001',
      role: 'Manager',
      email: 'manager001@example.com',
    };

    const participant_pm: DeploymentParticipant = {
      userId: 'pm-001',
      role: 'ProjectManager',
      email: 'pm001@example.com',
    };

    const participantList: DeploymentParticipant[] = [
      participant_pm,
      participant_manager,
      participant_engineer_01,
      {
        userId: 'engineer-002',
        role: 'Engineer',
        email: 'engineer002@example.com',
      },
      {
        userId: 'engineer-003',
        role: 'Engineer',
        email: 'engineer003@example.com',
      },
      {
        userId: 'engineer-004',
        role: 'Engineer',
        email: 'engineer004@example.com',
      },
      {
        userId: 'engineer-005',
        role: 'Engineer',
        email: 'engineer005@example.com',
      },
      {
        userId: 'engineer-006',
        role: 'Engineer',
        email: 'engineer006@example.com',
      },
      {
        userId: 'engineer-007',
        role: 'Engineer',
        email: 'engineer007@example.com',
      },
      {
        userId: 'engineer-008',
        role: 'Engineer',
        email: 'engineer008@example.com',
      },
      {
        userId: 'engineer-009',
        role: 'Engineer',
        email: 'engineer009@example.com',
      },
      {
        userId: 'engineer-010',
        role: 'Engineer',
        email: 'engineer010@example.com',
      },
    ];

    const agentInput: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime,
    };

    const agentOutput: Tx10AgentOutput = await runTx10Imp1Agent(
      agentInput,
      mockTextAnalysisServiceAdapter as any,
      mockNotificationServiceAdapter as any
    );

    const initialReportAnalysis = agentOutput.initialReportAnalysis;

    expect(initialReportAnalysis).toBeDefined();
    expect(initialReportAnalysis.submissionRate).toBe(100);
    expect(initialReportAnalysis.dataQualityScore).toBe(92);
    expect(initialReportAnalysis.formatUniformityScore).toBe(95);
    expect(initialReportAnalysis.feedbackItems).toHaveLength(0);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    expect(agentOutput.onboardingApprovalStatus).toBeDefined();
    expect(agentOutput.onboardingApprovalStatus.isApproved).toBe(true);
  });
});