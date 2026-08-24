import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type DeploymentParticipant } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('朝会報告管理システム - 初期導入・ユーザー教育フロー（tx_10）', () => {
  // SCEN-2667: [edge] 初期導入・ユーザー教育フロー（tx_10）における再テスト報告入力期限管理 - 再テスト報告の開始日と期限日が同日である場合、入力可能期間が1日として扱われる
  test('再テスト報告の開始日と期限日が同日の場合、入力可能期間が1日として計算される', async () => {
    const deploymentInitiationTimestamp = new Date('2026-08-20T08:00:00Z');
    const retestStartDate = new Date('2026-08-20T09:00:00Z');
    const retestDeadlineDate = new Date('2026-08-20T17:00:00Z');

    const participantList: DeploymentParticipant[] = [
      {
        userId: 'eng_user_001',
        role: 'Engineer',
        email: 'engineer1@example.com'
      },
      {
        userId: 'eng_user_002',
        role: 'Engineer',
        email: 'engineer2@example.com'
      },
      {
        userId: 'eng_user_003',
        role: 'Engineer',
        email: 'engineer3@example.com'
      },
      {
        userId: 'eng_user_004',
        role: 'Engineer',
        email: 'engineer4@example.com'
      },
      {
        userId: 'eng_user_005',
        role: 'Engineer',
        email: 'engineer5@example.com'
      },
      {
        userId: 'eng_user_006',
        role: 'Engineer',
        email: 'engineer6@example.com'
      },
      {
        userId: 'eng_user_007',
        role: 'Engineer',
        email: 'engineer7@example.com'
      },
      {
        userId: 'eng_user_008',
        role: 'Engineer',
        email: 'engineer8@example.com'
      },
      {
        userId: 'eng_user_009',
        role: 'Engineer',
        email: 'engineer9@example.com'
      },
      {
        userId: 'eng_user_010',
        role: 'Engineer',
        email: 'engineer10@example.com'
      },
      {
        userId: 'mgr_user_001',
        role: 'Manager',
        email: 'manager@example.com'
      },
      {
        userId: 'pm_user_001',
        role: 'ProjectManager',
        email: 'pm@example.com'
      }
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00'
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredAt: new Date('2026-08-20T09:00:00Z')
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched_001',
        scheduledTime: new Date('2026-08-20T08:30:00Z')
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        notificationId: 'notif_001',
        status: 'delivered'
      })
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'API統合', frequency: 1, confidence: 0.92 },
          { keyword: '単体テスト', frequency: 1, confidence: 0.88 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 65,
        affectedTeams: 2
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
        reason: 'Moderate impact on integration timeline'
      })
    };

    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, mockNotificationServiceAdapter, mockTextAnalysisServiceAdapter);

    expect(output).toBeDefined();
    expect(output.deploymentSchedule).toBeDefined();
    expect(output.deploymentSchedule.startDate).toEqual(new Date('2026-08-27T00:00:00Z'));
    expect(output.deploymentSchedule.retestReportingStartDate).toEqual(retestStartDate);
    expect(output.deploymentSchedule.retestReportingDeadlineDate).toEqual(retestDeadlineDate);

    const retestAvailableDays = Math.floor(
      (retestDeadlineDate.getTime() - retestStartDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    expect(retestAvailableDays).toBe(1);

    expect(output.trainingMaterials).toBeDefined();
    expect(Array.isArray(output.trainingMaterials)).toBe(true);
    expect(output.trainingMaterials.length).toBeGreaterThan(0);

    const managerGuideMaterial = output.trainingMaterials.find(
      (material) => material.targetRole === 'Manager'
    );
    expect(managerGuideMaterial).toBeDefined();
    expect(managerGuideMaterial?.content).toBeDefined();
    expect(managerGuideMaterial?.content.length).toBeGreaterThan(0);

    expect(output.initialReportAnalysis).toBeDefined();
    expect(output.initialReportAnalysis.submissionRate).toBeGreaterThanOrEqual(0);
    expect(output.initialReportAnalysis.submissionRate).toBeLessThanOrEqual(100);
    expect(output.initialReportAnalysis.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(output.initialReportAnalysis.dataQualityScore).toBeLessThanOrEqual(100);
    expect(output.initialReportAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(0);
    expect(output.initialReportAnalysis.formatUniformityScore).toBeLessThanOrEqual(100);

    expect(output.onboardingApprovalStatus).toBeDefined();
    expect(
      output.onboardingApprovalStatus.approvalStatus === 'approved' ||
      output.onboardingApprovalStatus.approvalStatus === 'rejected'
    ).toBe(true);
    expect(output.onboardingApprovalStatus.canProceedToProductionDeployment).toBe(
      typeof output.onboardingApprovalStatus.canProceedToProductionDeployment === 'boolean'
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});