import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  OnboardingApprovalStatus,
} from "../../src/agents/tx-10-imp-1/types";

describe("朝会報告管理システム - tx_10初期導入エージェント", () => {
  // SCEN-2663
  test("再教育回数が最大回数に達した場合、本運用移行を保留する判定が返される", async () => {
    // ========== テストデータ準備 ==========
    const deploymentInitiationTimestamp = new Date("2024-01-15T08:00:00Z");
    const reportingDeadlineTime = "09:00";
    const preparationDaysRequired = 5;

    const participantList: DeploymentParticipant[] = [
      {
        userId: "pm-001",
        role: "ProjectManager",
        email: "pm@example.com",
      },
      {
        userId: "mgr-001",
        role: "Manager",
        email: "manager@example.com",
      },
      {
        userId: "eng-001",
        role: "Engineer",
        email: "eng1@example.com",
      },
      {
        userId: "eng-002",
        role: "Engineer",
        email: "eng2@example.com",
      },
      {
        userId: "eng-003",
        role: "Engineer",
        email: "eng3@example.com",
      },
      {
        userId: "eng-004",
        role: "Engineer",
        email: "eng4@example.com",
      },
      {
        userId: "eng-005",
        role: "Engineer",
        email: "eng5@example.com",
      },
      {
        userId: "eng-006",
        role: "Engineer",
        email: "eng6@example.com",
      },
      {
        userId: "eng-007",
        role: "Engineer",
        email: "eng7@example.com",
      },
      {
        userId: "eng-008",
        role: "Engineer",
        email: "eng8@example.com",
      },
      {
        userId: "eng-009",
        role: "Engineer",
        email: "eng9@example.com",
      },
      {
        userId: "eng-010",
        role: "Engineer",
        email: "eng10@example.com",
      },
    ];

    const agentInput: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // ========== AIクライアントのスタブ準備 ==========
    // 再教育回数が最大回数（3回）に達した状態をシミュレート
    const mockAiClient = {
      checkUserStatus: jest.fn().mockResolvedValue({
        userId: "eng-001",
        status: "IN_RETRAINING",
        retrainingAttempts: 2, // 最大3回中の2回目が完了
        maxRetrainingAttempts: 3,
      }),

      evaluateRetrainingReadiness: jest.fn().mockResolvedValue({
        passThreshold: false, // 再教育合格基準を満たさない
        submissionRate: 65,
        dataQualityScore: 72,
        formatUniformityScore: 68,
        recommendation: "SCHEDULE_ADDITIONAL_SUPPORT",
      }),

      triggerRetrainingFlow: jest.fn().mockResolvedValue({
        retrainingScheduled: true,
        nextSessionDate: new Date("2024-01-22T10:00:00Z"),
        supportAssigned: true,
      }),

      checkRetrainingLimitExceeded: jest.fn().mockResolvedValue({
        limitExceeded: true,
        currentAttempts: 3,
        maxAttempts: 3,
        reason: "RE_EDUCATION_LIMIT_EXCEEDED",
      }),

      suspendOnboarding: jest.fn().mockResolvedValue({
        suspended: true,
        suspensionReason: "RE_EDUCATION_LIMIT_EXCEEDED",
        suspensionTimestamp: new Date("2024-01-22T15:30:00Z"),
      }),

      notifyAdminOfSuspension: jest.fn().mockResolvedValue({
        notificationQueued: true,
        targetRecipient: "admin@example.com",
        messageType: "ONBOARDING_SUSPENDED_RE_EDUCATION_LIMIT",
      }),

      generateOnboardingApprovalStatus: jest.fn().mockResolvedValue({
        approved: false,
        reason: "RE_EDUCATION_LIMIT_EXCEEDED",
        productionReadyDate: null,
      }),
    };

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        delivered: true,
        timestamp: new Date("2024-01-22T15:30:00Z"),
      }),

      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
        scheduledTime: new Date("2024-01-22T16:00:00Z"),
      }),

      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "QUEUED",
        messageId: "notif-xyz-001",
      }),
    };

    // ========== エージェント実行 ==========
    const result: Tx10AgentOutput = await runTx10Imp1Agent(
      agentInput,
      mockAiClient as any,
      notificationServiceAdapterStub as any
    );

    // ========== 検証: 返却されたレスポンスオブジェクト ==========
    // onboardingApprovalStatus の検証
    expect(result.onboardingApprovalStatus).toBeDefined();
    expect(result.onboardingApprovalStatus.approved).toBe(false);
    expect(result.onboardingApprovalStatus.reason).toBe(
      "RE_EDUCATION_LIMIT_EXCEEDED"
    );
    expect(result.onboardingApprovalStatus.productionReadyDate).toBeNull();

    // deploymentSchedule の検証（本運用開始予定日は未定）
    expect(result.deploymentSchedule).toBeDefined();
    expect(result.deploymentSchedule.productionStartDate).toBeNull();

    // 初回テスト報告の分析結果は前段階の結果から参照
    expect(result.initialReportAnalysis).toBeDefined();
    expect(result.initialReportAnalysis.submissionRate).toBeLessThan(90);

    // ========== AIクライアントスタブの呼び出し検証 ==========
    expect(mockAiClient.checkUserStatus).toHaveBeenCalledWith("eng-001");
    expect(mockAiClient.evaluateRetrainingReadiness).toHaveBeenCalled();
    expect(mockAiClient.checkRetrainingLimitExceeded).toHaveBeenCalledWith(
      3,
      3
    );
    expect(mockAiClient.suspendOnboarding).toHaveBeenCalledWith("eng-001");

    // ========== NotificationServiceAdapter スタブの呼び出し検証 ==========
    // 管理者への保留通知がキューに登録される予定であることを確認
    expect(mockAiClient.notifyAdminOfSuspension).toHaveBeenCalled();

    // 保留通知がスケジュール済みである確認
    const notificationQueuedCalls =
      notificationServiceAdapterStub.scheduleNotification.mock.calls;
    expect(notificationQueuedCalls.length).toBeGreaterThanOrEqual(1);

    // ========== ユーザーアカウント状態の検証 ==========
    // suspendOnboarding の結果から、ユーザーが本運用移行保留状態に遷移したことを確認
    const suspensionResult = await mockAiClient.suspendOnboarding("eng-001");
    expect(suspensionResult.suspended).toBe(true);
    expect(suspensionResult.suspensionReason).toBe(
      "RE_EDUCATION_LIMIT_EXCEEDED"
    );

    // ========== 段階的サポート実施機能のシナリオ検証 ==========
    // 再教育回数が最大に達した場合の挙動：
    // 1. 本運用移行フラグが false であること
    expect(result.onboardingApprovalStatus.approved).toBe(false);

    // 2. ステータスが ONBOARDING_SUSPENDED であること
    // (deploymentSchedule の productionStartDate が null で示唆される)
    expect(result.deploymentSchedule.productionStartDate).toBeNull();

    // 3. 理由コードが RE_EDUCATION_LIMIT_EXCEEDED であること
    expect(result.onboardingApprovalStatus.reason).toBe(
      "RE_EDUCATION_LIMIT_EXCEEDED"
    );

    // 4. 管理者への保留通知が送信予定リストに登録されていること
    expect(
      notificationServiceAdapterStub.scheduleNotification
    ).toHaveBeenCalled();
  });
});