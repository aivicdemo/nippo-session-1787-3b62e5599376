import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput, DeploymentParticipant, InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('朝会報告管理システム - Tx10 初期導入・ユーザー教育フロー', () => {
  // SCEN-2633: [normal] 本運用移行判定 - 全員が合格基準に達した場合、本運用移行可能と判定される
  test('全10名が3項目すべて入力済みの初回テスト報告を提出した場合、本運用移行可能と判定される', async () => {
    // === Setup: テストデータの準備 ===
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    
    const participantList: DeploymentParticipant[] = [
      {
        userId: 'eng_001',
        role: 'Engineer',
        email: 'engineer1@example.com',
      },
      {
        userId: 'eng_002',
        role: 'Engineer',
        email: 'engineer2@example.com',
      },
      {
        userId: 'eng_003',
        role: 'Engineer',
        email: 'engineer3@example.com',
      },
      {
        userId: 'eng_004',
        role: 'Engineer',
        email: 'engineer4@example.com',
      },
      {
        userId: 'eng_005',
        role: 'Engineer',
        email: 'engineer5@example.com',
      },
      {
        userId: 'eng_006',
        role: 'Engineer',
        email: 'engineer6@example.com',
      },
      {
        userId: 'eng_007',
        role: 'Engineer',
        email: 'engineer7@example.com',
      },
      {
        userId: 'eng_008',
        role: 'Engineer',
        email: 'engineer8@example.com',
      },
      {
        userId: 'eng_009',
        role: 'Engineer',
        email: 'engineer9@example.com',
      },
      {
        userId: 'eng_010',
        role: 'Engineer',
        email: 'engineer10@example.com',
      },
      {
        userId: 'mgr_001',
        role: 'Manager',
        email: 'manager@example.com',
      },
      {
        userId: 'pm_001',
        role: 'ProjectManager',
        email: 'pm@example.com',
      },
    ];

    const preparationDaysRequired = 5;
    const reportingDeadlineTime = '09:00';

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // === Mock AI Client: 全員合格基準達成の初回テスト報告結果 ===
    const mockAiClient = {
      evaluateOperationalReadiness: async () => {
        // 全10名が3項目すべて入力済みで、提出率90%以上、品質80点以上、形式統一度85%以上
        const analysisResult: InitialReportAnalysisResult = {
          submissionRate: 100, // 10名全員が提出
          dataQualityScore: 85, // 品質スコア85点 (基準80点以上)
          formatUniformityScore: 90, // 形式統一度90% (基準85%以上)
          feedbackItems: [], // フィードバックなし（全員合格）
        };
        return analysisResult;
      },
      generateDeploymentSchedule: async () => {
        return {
          startDate: new Date('2024-01-15T00:00:00Z'),
          phase1Deadline: new Date('2024-01-20T00:00:00Z'),
          phase2Deadline: new Date('2024-01-27T00:00:00Z'),
          productionStartDate: new Date('2024-02-01T00:00:00Z'),
        };
      },
      generateTrainingMaterials: async () => {
        return [
          {
            title: '部長向けガイド資料',
            format: 'PDF',
            targetRole: 'Manager',
          },
          {
            title: 'エンジニア向け研修教材',
            format: 'Video',
            targetRole: 'Engineer',
          },
        ];
      },
      determineApprovalStatus: async () => {
        // 全合格条件を満たしたため、承認可能と判定
        return {
          isApproved: true,
          canProceedToProduction: true,
          approvalReasoning: '全10名が合格基準を達成。提出率100%、品質85点、形式統一度90%で全て基準超過。本運用移行可能。',
        };
      },
    };

    // === 実行: runTx10Imp1Agent を呼び出し ===
    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient);

    // === 検証: 期待される結果 ===
    // 1. deploymentSchedule が正しく設定されていること
    expect(output.deploymentSchedule).toBeDefined();
    expect(output.deploymentSchedule.startDate).toEqual(new Date('2024-01-15T00:00:00Z'));
    expect(output.deploymentSchedule.productionStartDate).toEqual(new Date('2024-02-01T00:00:00Z'));

    // 2. trainingMaterials が2件（部長向け＋エンジニア向け）生成されていること
    expect(output.trainingMaterials).toBeDefined();
    expect(output.trainingMaterials.length).toBe(2);
    expect(output.trainingMaterials[0].title).toBe('部長向けガイド資料');
    expect(output.trainingMaterials[1].title).toBe('エンジニア向け研修教材');

    // 3. initialReportAnalysis が全合格基準を満たすこと
    expect(output.initialReportAnalysis).toBeDefined();
    expect(output.initialReportAnalysis.submissionRate).toBe(100);
    expect(output.initialReportAnalysis.dataQualityScore).toBe(85);
    expect(output.initialReportAnalysis.formatUniformityScore).toBe(90);
    expect(output.initialReportAnalysis.feedbackItems.length).toBe(0); // フィードバック項目なし

    // 4. onboardingApprovalStatus が「本運用移行可能」と判定されること
    expect(output.onboardingApprovalStatus).toBeDefined();
    expect(output.onboardingApprovalStatus.isApproved).toBe(true);
    expect(output.onboardingApprovalStatus.canProceedToProduction).toBe(true);
    expect(output.onboardingApprovalStatus.approvalReasoning).toContain('本運用移行可能');

    // 5. 合格基準の根拠が記録されていること
    // - 提出率90%以上（期待値: 100%）
    expect(output.initialReportAnalysis.submissionRate).toBeGreaterThanOrEqual(90);
    // - データ品質80点以上（期待値: 85点）
    expect(output.initialReportAnalysis.dataQualityScore).toBeGreaterThanOrEqual(80);
    // - 形式統一度85%以上（期待値: 90%）
    expect(output.initialReportAnalysis.formatUniformityScore).toBeGreaterThanOrEqual(85);
  });
});