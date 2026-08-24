import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput, type DeploymentParticipant, type InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/types';

describe('朝会報告管理システム - 初期導入・ユーザー教育フロー（tx_10）', () => {
  // SCEN-2658: [edge] 初期導入・ユーザー教育フロー（tx_10）における再教育判定機能 - 初回テスト報告入力が合格基準を1ポイント下回る場合、不合格と判定される
  test('初回テスト報告のデータ品質スコアが合格基準（80）を1ポイント下回る79ポイントの場合、不合格と判定され再教育対象フラグがtrueになること', async () => {
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const participantList: DeploymentParticipant[] = [
      {
        userId: 'pm_001',
        role: 'ProjectManager',
        email: 'pm@example.com',
      },
      {
        userId: 'manager_001',
        role: 'Manager',
        email: 'manager@example.com',
      },
      {
        userId: 'eng_001',
        role: 'Engineer',
        email: 'eng_001@example.com',
      },
      {
        userId: 'eng_002',
        role: 'Engineer',
        email: 'eng_002@example.com',
      },
      {
        userId: 'eng_003',
        role: 'Engineer',
        email: 'eng_003@example.com',
      },
      {
        userId: 'eng_004',
        role: 'Engineer',
        email: 'eng_004@example.com',
      },
      {
        userId: 'eng_005',
        role: 'Engineer',
        email: 'eng_005@example.com',
      },
      {
        userId: 'eng_006',
        role: 'Engineer',
        email: 'eng_006@example.com',
      },
      {
        userId: 'eng_007',
        role: 'Engineer',
        email: 'eng_007@example.com',
      },
      {
        userId: 'eng_008',
        role: 'Engineer',
        email: 'eng_008@example.com',
      },
      {
        userId: 'eng_009',
        role: 'Engineer',
        email: 'eng_009@example.com',
      },
      {
        userId: 'eng_010',
        role: 'Engineer',
        email: 'eng_010@example.com',
      },
    ];

    const agentInput: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    const mockAiClient = {
      assessOperationalReadiness: jest.fn().mockResolvedValue({
        isReadyForProduction: false,
        requiresAdditionalTraining: true,
        estimatedProductionReadinessDate: new Date('2024-01-20T00:00:00Z'),
      }),
      generateDeploymentSchedule: jest.fn().mockResolvedValue({
        startDate: new Date('2024-01-15T00:00:00Z'),
        phase1DeadlineDate: new Date('2024-01-16T00:00:00Z'),
        phase2DeadlineDate: new Date('2024-01-17T00:00:00Z'),
        phase3DeadlineDate: new Date('2024-01-18T00:00:00Z'),
        productionStartDate: new Date('2024-01-22T00:00:00Z'),
      }),
      generateTrainingMaterials: jest.fn().mockResolvedValue({
        managerGuideContent: 'Manager Guide',
        engineerTrainingContent: 'Engineer Training',
      }),
      evaluateInitialReportQuality: jest.fn().mockResolvedValue({
        submissionRate: 100,
        dataQualityScore: 79,
        formatUniformityScore: 85,
        feedbackItems: [
          {
            userId: 'eng_001',
            feedbackText: 'Please provide more detailed task descriptions',
            improvementCategory: 'DetailLevel',
          },
        ],
      }),
      determineOnboardingApproval: jest.fn().mockResolvedValue({
        approvalStatus: 'REJECTED',
        isReadyForProduction: false,
        rejectionReason: 'Data quality score below 80 threshold',
      }),
    };

    const result: Tx10AgentOutput = await runTx10Imp1Agent(agentInput, mockAiClient);

    expect(result.initialReportAnalysis).toBeDefined();
    expect(result.initialReportAnalysis.dataQualityScore).toBe(79);
    expect(result.initialReportAnalysis.submissionRate).toBe(100);
    expect(result.initialReportAnalysis.formatUniformityScore).toBe(85);

    expect(result.onboardingApprovalStatus).toBeDefined();
    expect(result.onboardingApprovalStatus.approvalStatus).toBe('REJECTED');
    expect(result.onboardingApprovalStatus.isReadyForProduction).toBe(false);

    expect(result.initialReportAnalysis.dataQualityScore < 80).toBe(true);
  });
});