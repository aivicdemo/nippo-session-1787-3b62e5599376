import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput, DeploymentParticipant, InitialReportAnalysisResult } from '../../src/agents/tx-10-imp-1/orchestrator';

describe('朝会報告管理システム - 初期導入・ユーザー教育フロー (tx_10)', () => {
  // SCEN-2657: 初回テスト報告入力が合格基準をちょうど満たす場合、不合格と判定されない
  test('初回テスト報告が合格ボーダー(70点)をちょうど満たす場合、合格判定され再教育対象外になること', async () => {
    // Arrange: 入力データ構築
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const participants: DeploymentParticipant[] = [
      {
        userId: 'pm-001',
        role: 'ProjectManager',
        email: 'pm@example.com',
      },
      {
        userId: 'manager-001',
        role: 'Manager',
        email: 'manager@example.com',
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
      {
        userId: 'eng-010',
        role: 'Engineer',
        email: 'eng010@example.com',
      },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList: participants,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // Arrange: AIクライアントのスタブ定義
    // 初回テスト報告入力が合格ボーダー(70点)をちょうど満たす場合
    // submissionRate: 90% (全12名中10.8名 ≈ 10名以上提出 = 合格基準90%満たす)
    // dataQualityScore: 80点 (合格基準80点以上 = ちょうど満たす)
    // formatUniformityScore: 85% (合格基準85%以上 = ちょうど満たす)
    const stubAiClient = {
      evaluateOperationReadiness: jest.fn(async () => ({
        isReadyForProduction: true,
        readinessScore: 85,
        recommendations: [],
      })),
      generateOnboardingApprovalDecision: jest.fn(async () => ({
        approvalStatus: 'approved',
        canProceedToProduction: true,
      })),
    };

    // Act: 初期導入・ユーザー教育フローを実行
    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, stubAiClient);

    // Assert: 初回テスト報告の品質評価結果を検証
    expect(output.initialReportAnalysis).toBeDefined();
    expect(output.initialReportAnalysis.submissionRate).toBe(90);
    expect(output.initialReportAnalysis.dataQualityScore).toBe(80);
    expect(output.initialReportAnalysis.formatUniformityScore).toBe(85);

    // Assert: 合格基準の確認
    // - submissionRate >= 90: 90 >= 90 ✓
    // - dataQualityScore >= 80: 80 >= 80 ✓
    // - formatUniformityScore >= 85: 85 >= 85 ✓
    // すべての条件を満たすため、本運用へ移行可能
    expect(output.onboardingApprovalStatus.canProceedToProduction).toBe(true);

    // Assert: 再教育判定結果が「合格」（再教育対象外）であることを確認
    expect(output.onboardingApprovalStatus.approvalStatus).toBe('approved');

    // Assert: デプロイメントスケジュールが正しく生成されていること
    expect(output.deploymentSchedule).toBeDefined();
    expect(output.deploymentSchedule.deploymentStartDate).toBeDefined();
    expect(output.deploymentSchedule.productionStartDate).toBeDefined();

    // Assert: 訓練教材が生成されていること
    expect(output.trainingMaterials).toBeDefined();
    expect(output.trainingMaterials.length).toBeGreaterThan(0);

    // Assert: フィードバック項目がない、または改善不要のステータスであること
    // (合格基準を満たしているため、特別な改善指示がないことを確認)
    expect(output.initialReportAnalysis.feedbackItems).toEqual([]);
  });
});