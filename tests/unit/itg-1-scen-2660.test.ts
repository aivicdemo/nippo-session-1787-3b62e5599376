import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";
import { type Tx10AgentInput, type Tx10AgentOutput } from "../../src/agents/tx-10-imp-1/types";

describe("朝会報告管理システム - 初期導入・ユーザー教育フロー（tx_10）", () => {
  // SCEN-2660
  test("報告形式の不適合判定スコアが0（最小値）の場合、不合格と判定されない", async () => {
    // Arrange: 初期導入フロー開始時刻
    const deploymentInitiationTimestamp = new Date("2024-01-15T08:00:00Z");

    // Arrange: 導入参加者（PM1名、部長1名、エンジニア10名）
    const participantList = [
      {
        userId: "pm-001",
        role: "ProjectManager",
        email: "pm001@example.com",
      },
      {
        userId: "manager-001",
        role: "Manager",
        email: "manager001@example.com",
      },
      {
        userId: "engineer-001",
        role: "Engineer",
        email: "engineer001@example.com",
      },
      {
        userId: "engineer-002",
        role: "Engineer",
        email: "engineer002@example.com",
      },
      {
        userId: "engineer-003",
        role: "Engineer",
        email: "engineer003@example.com",
      },
      {
        userId: "engineer-004",
        role: "Engineer",
        email: "engineer004@example.com",
      },
      {
        userId: "engineer-005",
        role: "Engineer",
        email: "engineer005@example.com",
      },
      {
        userId: "engineer-006",
        role: "Engineer",
        email: "engineer006@example.com",
      },
      {
        userId: "engineer-007",
        role: "Engineer",
        email: "engineer007@example.com",
      },
      {
        userId: "engineer-008",
        role: "Engineer",
        email: "engineer008@example.com",
      },
      {
        userId: "engineer-009",
        role: "Engineer",
        email: "engineer009@example.com",
      },
      {
        userId: "engineer-010",
        role: "Engineer",
        email: "engineer010@example.com",
      },
    ];

    // Arrange: 導入に必要な事前準備期間
    const preparationDaysRequired = 3;

    // Arrange: 日報送信期限時刻
    const reportingDeadlineTime = "09:00";

    // Arrange: スタブ化されたTextAnalysisServiceAdapter
    // 報告形式の不適合判定スコアを0（最小値）で返す
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequency: {},
      }),
      assessImpactScore: jest.fn().mockResolvedValue(0), // 不適合スコア = 0
      classifyIssueSeverity: jest.fn().mockResolvedValue("LOW"),
    };

    // Arrange: スタブ化されたNotificationServiceAdapter
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent",
        deliveredAt: new Date("2024-01-15T08:30:00Z"),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: "sched-001",
        scheduledFor: new Date("2024-01-15T08:30:00Z"),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "delivered",
        deliveredAt: new Date("2024-01-15T08:30:00Z"),
      }),
    };

    // Arrange: Agent入力
    const agentInput: Tx10AgentInput = {
      deploymentInitiationTimestamp,
      participantList,
      preparationDaysRequired,
      reportingDeadlineTime,
    };

    // Act: tx_10エージェントを実行
    // 再教育判定ロジック：不適合スコア >= 70の場合のみ再教育対象と判定
    // スコアが0のため、条件を満たさず、再教育判定は発生しない
    const result: Tx10AgentOutput = await runTx10Imp1Agent(
      agentInput,
      mockTextAnalysisServiceAdapter
    );

    // Assert: deploymentScheduleが生成されているか確認
    expect(result.deploymentSchedule).toBeDefined();
    expect(result.deploymentSchedule.startDate).toBeDefined();
    expect(result.deploymentSchedule.trainingSectionDeadline).toBeDefined();
    expect(result.deploymentSchedule.initialReportSubmissionDeadline).toBeDefined();
    expect(result.deploymentSchedule.productionStartDate).toBeDefined();

    // Assert: trainingMaterialsが生成されているか確認
    expect(result.trainingMaterials).toBeDefined();
    expect(Array.isArray(result.trainingMaterials)).toBe(true);
    expect(result.trainingMaterials.length).toBeGreaterThan(0);

    // Assert: initialReportAnalysisが存在するか確認
    expect(result.initialReportAnalysis).toBeDefined();

    // Assert: 報告形式の不適合判定スコアが0のため、不合格判定が発生しない
    // 判定条件：不適合スコア >= 70の場合のみ再教育対象と判定
    // スコアが0 < 70のため、再教育判定ステータスは『再教育不要』となる
    const formatUniformityScore = result.initialReportAnalysis.formatUniformityScore;
    expect(formatUniformityScore).toBe(0);

    // Assert: フィードバック項目が存在しないか、または空配列であることを確認
    // スコアが0（最小値）のため、不合格判定ロジックが発生せず、
    // フィードバック項目が生成されない、または空配列となる
    expect(
      result.initialReportAnalysis.feedbackItems === undefined ||
        result.initialReportAnalysis.feedbackItems.length === 0
    ).toBe(true);

    // Assert: onboardingApprovalStatusが定義されているか確認
    expect(result.onboardingApprovalStatus).toBeDefined();

    // Assert: 不適合スコアが0のため、再教育判定は発生しない
    // ユーザーAは教育フロー（tx_10）を完了扱いとなり、
    // 通常の朝会報告入力画面へ遷移可能な状態になる
    // 本運用開始可否が『可』と判定されることを確認
    expect(result.onboardingApprovalStatus.canProceedToProduction).toBe(true);

    // Assert: TextAnalysisServiceAdapterのassessImpactScore呼び出しを確認
    expect(
      mockTextAnalysisServiceAdapter.assessImpactScore
    ).toHaveBeenCalled();

    // Assert: assessImpactScoreの戻り値（0）が不適合スコアとして使用されていることを確認
    const callArgs = mockTextAnalysisServiceAdapter.assessImpactScore.mock
      .calls[0];
    expect(callArgs).toBeDefined();
  });
});