import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  InitialReportAnalysisResult,
} from '../../src/agents/tx-10-imp-1/types';

describe('tx-10-imp-1: 朝会報告アプリ初期導入・ユーザー教育 - 初回テスト運用判定', () => {
  // SCEN-2620: [edge] 初回テスト運用判定機能 - 複数の条件が閾値未満のとき改善フェーズに戻す
  test('should keep onboarding status at improvement phase when all evaluation conditions fall below thresholds', async () => {
    // Arrange: テスト運用判定機能の初期状態を確認
    const deploymentInitiationTimestamp = new Date('2024-01-15T09:00:00Z');
    const participantList: DeploymentParticipant[] = [
      { userId: 'user_001', role: 'ProjectManager', email: 'pm@example.com' },
      { userId: 'user_002', role: 'Manager', email: 'manager@example.com' },
      { userId: 'user_003', role: 'Engineer', email: 'eng_001@example.com' },
      { userId: 'user_004', role: 'Engineer', email: 'eng_002@example.com' },
      { userId: 'user_005', role: 'Engineer', email: 'eng_003@example.com' },
      { userId: 'user_006', role: 'Engineer', email: 'eng_004@example.com' },
      { userId: 'user_007', role: 'Engineer', email: 'eng_005@example.com' },
      { userId: 'user_008', role: 'Engineer', email: 'eng_006@example.com' },
      { userId: 'user_009', role: 'Engineer', email: 'eng_007@example.com' },
      { userId: 'user_010', role: 'Engineer', email: 'eng_008@example.com' },
      { userId: 'user_011', role: 'Engineer', email: 'eng_009@example.com' },
      { userId: 'user_012', role: 'Engineer', email: 'eng_010@example.com' },
    ];

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime: '09:00',
    };

    // 複数の条件を設定（過去7日間、対象者数：10名エンジニア）
    // 条件A（日報提出率） = 60% < 閾値 75%
    // 条件B（課題抽出率） = 55% < 閾値 75%
    // 条件C（通知配信成功率） = 70% < 閾値 90%
    const mockAiClient = {
      evaluateInitialReportSubmissionRate: jest.fn().mockResolvedValue({
        submissionRate: 60,
        submissionThreshold: 75,
        evaluationPeriodDays: 7,
        targetParticipantCount: 10,
      }),
      evaluateIssueExtractionRate: jest.fn().mockResolvedValue({
        extractionRate: 55,
        extractionThreshold: 75,
        evaluatedReportCount: 10,
      }),
      evaluateNotificationDeliverySuccessRate: jest.fn().mockResolvedValue({
        deliverySuccessRate: 70,
        deliveryThreshold: 90,
        totalNotificationsSent: 10,
        successfulDeliveries: 7,
      }),
      determineOnboardingApprovalStatus: jest.fn().mockResolvedValue({
        allConditionsMet: false,
        submissionRateMet: false,
        extractionRateMet: false,
        deliverySuccessMet: false,
        recommendedStatus: 'improvement_phase',
        evaluationTimestamp: new Date('2024-01-15T11:00:00Z'),
      }),
      recordEvaluationLog: jest.fn().mockResolvedValue({
        logId: 'eval_log_001',
        evaluationTimestamp: new Date('2024-01-15T11:00:00Z'),
        conditionA_submissionRate: 60,
        conditionA_threshold: 75,
        conditionA_met: false,
        conditionB_extractionRate: 55,
        conditionB_threshold: 75,
        conditionB_met: false,
        conditionC_deliverySuccessRate: 70,
        conditionC_threshold: 90,
        conditionC_met: false,
        allConditionsMet: false,
        statusTransition: 'none',
        statusReason: 'すべての条件が閾値未満のため改善フェーズを継続',
      }),
    };

    // Act: 初回テスト運用判定処理を実行
    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, mockAiClient);

    // Assert: 運用判定ステータスが『改善フェーズ』のまま維持される
    expect(output.onboardingApprovalStatus.approvalStatus).toBe(
      'improvement_phase'
    );
    expect(output.onboardingApprovalStatus.canProceedToProduction).toBe(false);

    // 判定ログテーブルに記録された条件評価内容を検証
    expect(mockAiClient.recordEvaluationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        evaluationTimestamp: new Date('2024-01-15T11:00:00Z'),
        conditionA_submissionRate: 60,
        conditionA_threshold: 75,
        conditionA_met: false,
        conditionB_extractionRate: 55,
        conditionB_threshold: 75,
        conditionB_met: false,
        conditionC_deliverySuccessRate: 70,
        conditionC_threshold: 90,
        conditionC_met: false,
        allConditionsMet: false,
        statusReason: 'すべての条件が閾値未満のため改善フェーズを継続',
      })
    );

    // 判定結果メッセージを検証
    expect(output.onboardingApprovalStatus.judgmentDetail).toContain(
      '条件A:60% < 閾値75%'
    );
    expect(output.onboardingApprovalStatus.judgmentDetail).toContain(
      '条件B:55% < 閾値75%'
    );
    expect(output.onboardingApprovalStatus.judgmentDetail).toContain(
      '条件C:70% < 閾値90%'
    );
    expect(output.onboardingApprovalStatus.judgmentDetail).toContain(
      '全条件が閾値未満のため改善フェーズを継続'
    );

    // ステータス遷移は発生していないことを検証
    expect(output.onboardingApprovalStatus.statusTransitionOccurred).toBe(
      false
    );
    expect(output.onboardingApprovalStatus.previousStatus).toBe(
      'improvement_phase'
    );
    expect(output.onboardingApprovalStatus.currentStatus).toBe(
      'improvement_phase'
    );
  });
});