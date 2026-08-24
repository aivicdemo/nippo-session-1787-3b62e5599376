import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1: 朝会報告アプリ初期導入・ユーザー教育 - 初回報告データ評価', () => {
  // SCEN-2578: [normal] 初回報告データ評価機能 - 提出率90%以上・データ品質スコア80点以上・形式統一度85%以上で0件の報告がある場合、本格運用への移行判定が真になる
  test('should return onboardingApprovalStatus with approvalFlag true when all quality thresholds are met and violation count is zero', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportingDeadlineTime = '09:00';

    const participants = [
      { userId: 'engineer-001', role: 'Engineer', email: 'engineer001@example.com' },
      { userId: 'engineer-002', role: 'Engineer', email: 'engineer002@example.com' },
      { userId: 'engineer-003', role: 'Engineer', email: 'engineer003@example.com' },
      { userId: 'engineer-004', role: 'Engineer', email: 'engineer004@example.com' },
      { userId: 'engineer-005', role: 'Engineer', email: 'engineer005@example.com' },
      { userId: 'engineer-006', role: 'Engineer', email: 'engineer006@example.com' },
      { userId: 'engineer-007', role: 'Engineer', email: 'engineer007@example.com' },
      { userId: 'engineer-008', role: 'Engineer', email: 'engineer008@example.com' },
      { userId: 'engineer-009', role: 'Engineer', email: 'engineer009@example.com' },
      { userId: 'engineer-010', role: 'Engineer', email: 'engineer010@example.com' },
      { userId: 'manager-001', role: 'Manager', email: 'manager001@example.com' },
      { userId: 'pm-001', role: 'ProjectManager', email: 'pm001@example.com' },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList: participants,
      preparationDaysRequired: 5,
      reportingDeadlineTime,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '議論中の課題', frequency: 2, confidenceScore: 85 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'success',
        timestamp: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'schedule-001',
        status: 'scheduled',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, {
      textAnalysisServiceAdapter: mockTextAnalysisAdapter,
      notificationServiceAdapter: mockNotificationAdapter,
    });

    expect(output.onboardingApprovalStatus.approvalFlag).toBe(true);
    expect(output.onboardingApprovalStatus.readinessForProduction).toBe(true);

    expect(output.initialReportAnalysis.submissionRate).toBeGreaterThanOrEqual(90);
    expect(output.initialReportAnalysis.dataQualityScore).toBeGreaterThanOrEqual(80);
    expect(output.initialReportAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(85);

    expect(output.trainingMaterials).toBeDefined();
    expect(Array.isArray(output.trainingMaterials)).toBe(true);
    expect(output.trainingMaterials.length).toBeGreaterThan(0);

    expect(output.deploymentSchedule).toBeDefined();
    expect(output.deploymentSchedule.deploymentStartDate).toBeDefined();
    expect(output.deploymentSchedule.productionStartDate).toBeDefined();

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});