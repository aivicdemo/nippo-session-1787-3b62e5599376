import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import { type Tx10AgentInput, type Tx10AgentOutput } from '../../src/agents/tx-10-imp-1/types';

describe('朝会報告管理システム - 初期導入・ユーザー教育フロー（tx_10）', () => {
  // SCEN-2659: 初回テスト報告入力が合格基準を1ポイント上回る場合、合格と判定される
  test('should judge user as passing when test report score exceeds passing threshold by 1 point', async () => {
    // Setup: テストユーザーのセットアップと入力データの準備
    const deploymentInitiationTimestamp = new Date('2024-11-18T09:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 3;

    const participantList = [
      {
        userId: 'user-001',
        role: 'Engineer',
        email: 'engineer001@example.com',
      },
      {
        userId: 'user-002',
        role: 'Engineer',
        email: 'engineer002@example.com',
      },
      {
        userId: 'user-003',
        role: 'Engineer',
        email: 'engineer003@example.com',
      },
      {
        userId: 'user-004',
        role: 'Engineer',
        email: 'engineer004@example.com',
      },
      {
        userId: 'user-005',
        role: 'Engineer',
        email: 'engineer005@example.com',
      },
      {
        userId: 'user-006',
        role: 'Engineer',
        email: 'engineer006@example.com',
      },
      {
        userId: 'user-007',
        role: 'Engineer',
        email: 'engineer007@example.com',
      },
      {
        userId: 'user-008',
        role: 'Engineer',
        email: 'engineer008@example.com',
      },
      {
        userId: 'user-009',
        role: 'Engineer',
        email: 'engineer009@example.com',
      },
      {
        userId: 'user-010',
        role: 'Engineer',
        email: 'engineer010@example.com',
      },
      {
        userId: 'manager-001',
        role: 'Manager',
        email: 'manager001@example.com',
      },
      {
        userId: 'pm-001',
        role: 'ProjectManager',
        email: 'pm001@example.com',
      },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // Mock AI client with controlled response that provides score of 71 (1 point above passing threshold of 70)
    const mockAiClient = {
      generateDeploymentSchedule: jest.fn().mockResolvedValue({
        startDate: '2024-11-18',
        phase1Deadline: '2024-11-21',
        phase2Deadline: '2024-11-28',
        operationStartDate: '2024-11-25',
      }),
      validateInitialReportQuality: jest.fn().mockResolvedValue({
        submissionRate: 100,
        dataQualityScore: 71,
        formatUniformityScore: 85,
        feedbackItems: [],
      }),
      generateTrainingMaterials: jest.fn().mockResolvedValue({
        managerGuide: 'Guide content',
        engineerTraining: 'Training content',
      }),
      evaluateOnboardingApproval: jest.fn().mockResolvedValue({
        approved: true,
        status: 'APPROVED',
        remarks: 'All requirements met',
      }),
    };

    // Execute the orchestrator function with mocked AI client
    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient);

    // Verify: 合格基準を1ポイント上回る（71点）スコアでのシステム反応を検証
    expect(output.initialReportAnalysis.dataQualityScore).toBe(71);
    expect(output.onboardingApprovalStatus.approved).toBe(true);
    expect(output.onboardingApprovalStatus.status).toBe('APPROVED');

    // Verify: ユーザーステータスが「教育完了」に更新されたことを検証
    expect(output.onboardingApprovalStatus).toEqual(
      expect.objectContaining({
        approved: true,
        status: 'APPROVED',
      })
    );

    // Verify: 合格判定レコードが記録されるための出力構造を検証
    expect(output.initialReportAnalysis).toEqual(
      expect.objectContaining({
        submissionRate: 100,
        dataQualityScore: 71,
        formatUniformityScore: 85,
        feedbackItems: expect.any(Array),
      })
    );

    // Verify AI client was called with correct parameters for re-education judgment flow
    expect(mockAiClient.validateInitialReportQuality).toHaveBeenCalledTimes(1);
    expect(mockAiClient.evaluateOnboardingApproval).toHaveBeenCalledTimes(1);

    // Verify the orchestrator produces valid deployment schedule alongside approval
    expect(output.deploymentSchedule).toEqual(
      expect.objectContaining({
        startDate: expect.any(String),
        operationStartDate: expect.any(String),
      })
    );

    // Verify training materials are generated for the deployment
    expect(output.trainingMaterials).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: expect.any(String),
          content: expect.any(String),
        }),
      ])
    );
  });
});