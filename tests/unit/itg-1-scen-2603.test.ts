import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  InitialReportAnalysisResult,
  OnboardingApprovalStatus,
} from '../../src/agents/tx-10-imp-1/orchestrator';

describe('Tx10Imp1Agent - 初回報告データ品質評価', () => {
  // SCEN-2603: [error] 初回報告データ品質評価機能 - 提出率が89.9%で基準未達となり改善フェーズへの戻り指示が返る
  test('should return RETURN_TO_IMPROVEMENT_PHASE when submission rate is 89.9% (below 90% threshold)', async () => {
    // Setup: 部員10名のマスタデータを準備（部長1名、エンジニア9名）
    const deploymentParticipants: DeploymentParticipant[] = [
      {
        userId: 'mgr001',
        role: 'Manager',
        email: 'manager@example.com',
      },
      {
        userId: 'eng001',
        role: 'Engineer',
        email: 'eng001@example.com',
      },
      {
        userId: 'eng002',
        role: 'Engineer',
        email: 'eng002@example.com',
      },
      {
        userId: 'eng003',
        role: 'Engineer',
        email: 'eng003@example.com',
      },
      {
        userId: 'eng004',
        role: 'Engineer',
        email: 'eng004@example.com',
      },
      {
        userId: 'eng005',
        role: 'Engineer',
        email: 'eng005@example.com',
      },
      {
        userId: 'eng006',
        role: 'Engineer',
        email: 'eng006@example.com',
      },
      {
        userId: 'eng007',
        role: 'Engineer',
        email: 'eng007@example.com',
      },
      {
        userId: 'eng008',
        role: 'Engineer',
        email: 'eng008@example.com',
      },
      {
        userId: 'eng009',
        role: 'Engineer',
        email: 'eng009@example.com',
      },
    ];

    // Input: 初回テスト報告フロー - 提出率が89.9%の状態
    const deploymentInitiationTimestamp = new Date('2024-01-15T08:00:00Z');
    const reportingDeadlineTime = '09:00';
    const preparationDaysRequired = 5;

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList: deploymentParticipants,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // Stub: TextAnalysisServiceAdapter のスタブ化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'バグ', frequency: 2 },
        { keyword: '納期遅延', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    // Stub: NotificationServiceAdapter のスタブ化
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveredAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'sched-001',
        scheduledTime: new Date('2024-01-15T08:30:00Z'),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
        sentAt: new Date('2024-01-15T08:30:00Z'),
      }),
    };

    // Execution: 初回報告データ品質評価機能を実行
    // 提出率: 9/10 = 90% ではなく 89.9% を明示的に設定
    const output: Tx10AgentOutput = await runTx10Imp1Agent(input, {
      textAnalysisService: mockTextAnalysisServiceAdapter,
      notificationService: mockNotificationServiceAdapter,
      submissionRateOverride: 0.899, // 89.9%を明示的にセット
    });

    // Assertions: 期待結果の検証
    // 1. ステータスが RETURN_TO_IMPROVEMENT_PHASE であることを確認
    expect(output.onboardingApprovalStatus.approvalResult).toBe(
      'RETURN_TO_IMPROVEMENT_PHASE'
    );

    // 2. 承認されていないことを確認
    expect(output.onboardingApprovalStatus.isApproved).toBe(false);

    // 3. 改善フェーズへのリダイレクト情報が含まれていることを確認
    expect(output.onboardingApprovalStatus.redirectionInfo).toBeDefined();
    expect(output.onboardingApprovalStatus.redirectionInfo?.redirectTarget).toBe(
      'IMPROVEMENT_PHASE'
    );

    // 4. 初回報告分析結果に提出率89.9%が記録されていることを確認
    expect(output.initialReportAnalysis.submissionRate).toBe(89.9);

    // 5. 提出率が90%以上の基準を満たしていないことを確認（業務要件: 90%以上が合格）
    expect(output.initialReportAnalysis.submissionRate).toBeLessThan(90);

    // 6. 通知サービスが呼び出されていないことを確認（改善フェーズ戻り時は通知しない）
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

    // 7. 戻り指示の理由が提出率未達であることを確認
    expect(output.onboardingApprovalStatus.feedback).toContain('提出率');
  });
});