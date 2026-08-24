import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('Tx10 Agent - Initial deployment with onboarding approval', () => {
  // SCEN-2610: [edge] 初回テスト運用判定機能 - 提出率が90%未満のとき本格運用への移行条件を満たさない
  test('should determine that production migration is not allowed when submission rate is below 90 percent', async () => {
    // Setup: チームメンバー10名のうち9名が日報を提出した状態（提出率89%）
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const participantList = [
      {
        userId: 'pm-001',
        role: 'ProjectManager',
        email: 'pm001@example.com',
      },
      {
        userId: 'manager-001',
        role: 'Manager',
        email: 'manager001@example.com',
      },
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
      // eng-010 is not submitting report - this makes submission rate 9/10 = 90% - 1% = 89%
    ];

    const input = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // Create a mock AI client that simulates initial report analysis
    const mockAiClient = {
      extractKeywordsAsync: jest.fn().mockResolvedValue({
        keywords: ['keyword1', 'keyword2'],
        frequency: [5, 3],
      }),
      assessImpactScoreAsync: jest.fn().mockResolvedValue({
        impactScore: 65,
      }),
      classifyIssueSeverityAsync: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
      generateDeploymentScheduleAsync: jest.fn().mockResolvedValue({
        startDate: new Date('2024-01-16T00:00:00Z'),
        phase1Deadline: new Date('2024-01-20T00:00:00Z'),
        phase2Deadline: new Date('2024-01-25T00:00:00Z'),
        productionStartDate: new Date('2024-02-01T00:00:00Z'),
      }),
      generateTrainingMaterialsAsync: jest.fn().mockResolvedValue({
        managerGuide: 'Training material for managers',
        engineerMaterials: ['Material 1', 'Material 2'],
      }),
      analyzeInitialReportsAsync: jest.fn().mockResolvedValue({
        submissionRate: 89,
        dataQualityScore: 75,
        formatUniformityScore: 80,
        feedbackItems: [
          {
            userId: 'eng-010',
            issue: 'No submission',
            recommendation: 'Please submit your initial test report',
          },
        ],
      }),
      determineOnboardingApprovalAsync: jest.fn().mockResolvedValue({
        approvalStatus: 'rejected',
        reason: 'Submission rate below 90% threshold',
        canProceedToProduction: false,
      }),
    };

    // Execute: 初回テスト運用判定機能を実行
    const result = await runTx10Imp1Agent(input, mockAiClient);

    // Verify: 提出率が89%と算出されることを確認
    expect(result.initialReportAnalysis.submissionRate).toBe(89);

    // Verify: データ品質スコアと形式統一度が返されることを確認
    expect(result.initialReportAnalysis.dataQualityScore).toBe(75);
    expect(result.initialReportAnalysis.formatUniformityScore).toBe(80);

    // Verify: 未提出メンバーのフィードバック項目が返されることを確認
    expect(result.initialReportAnalysis.feedbackItems).toHaveLength(1);
    expect(result.initialReportAnalysis.feedbackItems[0].userId).toBe('eng-010');

    // Verify: 本格運用への移行可否判定が『移行不可』と判定されること
    expect(result.onboardingApprovalStatus.approvalStatus).toBe('rejected');
    expect(result.onboardingApprovalStatus.canProceedToProduction).toBe(false);

    // Verify: 運用移行判定ロジックが『テスト運用を継続する』というステータスを保持していること
    expect(result.onboardingApprovalStatus.reason).toMatch(/submission|below|threshold/i);

    // Verify: 本格運用への遷移処理が実行されないことを確認
    // productionStartDate は予定日であり、確定ではない状態
    expect(result.deploymentSchedule.productionStartDate).toBeDefined();

    // Verify: deployment schedule が正常に生成されていることを確認
    expect(result.deploymentSchedule.startDate).toEqual(new Date('2024-01-16T00:00:00Z'));
    expect(result.deploymentSchedule.phase1Deadline).toEqual(new Date('2024-01-20T00:00:00Z'));
    expect(result.deploymentSchedule.phase2Deadline).toEqual(new Date('2024-01-25T00:00:00Z'));

    // Verify: training materials が生成されていることを確認
    expect(result.trainingMaterials).toBeDefined();
    expect(result.trainingMaterials.length).toBeGreaterThan(0);

    // Verify: AI client methods were called with appropriate inputs
    expect(mockAiClient.analyzeInitialReportsAsync).toHaveBeenCalled();
    expect(mockAiClient.determineOnboardingApprovalAsync).toHaveBeenCalled();
  });
});