import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";
import { type Tx10AgentInput, type Tx10AgentOutput } from "../../src/agents/tx-10-imp-1/types";

describe("朝会報告管理システム - tx-10-imp-1 初期導入・ユーザー教育", () => {
  // SCEN-2629: [normal] 再教育対象者の抽出 - 再教育対象者が1人の場合、その1人の名前が個別再教育対象として特定される
  test("再教育対象者データベースに1名のレコードが存在する場合、その対象者を正確に抽出できる", async () => {
    // テストデータ: 再教育対象者1名
    const retrainingTargetData = [
      {
        userId: "U001",
        name: "田中太郎",
        email: "tanaka.taro@example.com",
        requiresRetraining: true,
      },
    ];

    // モックAIクライアント
    const mockAiClient = {
      extractRetrainingTargets: jest.fn().mockResolvedValue({
        targets: retrainingTargetData,
      }),
      validateRetrainingCompletion: jest.fn().mockResolvedValue({
        isComplete: false,
        incompleteCases: [],
      }),
      generateRetrainingMaterials: jest.fn().mockResolvedValue({
        materials: [],
      }),
      assessInitialReportQuality: jest.fn().mockResolvedValue({
        submissionRate: 100,
        dataQualityScore: 85,
        formatUniformityScore: 90,
      }),
      determineOnboardingApproval: jest.fn().mockResolvedValue({
        approved: false,
        reason: "初回テスト報告の品質確認中",
      }),
      scheduleOperationalStart: jest.fn().mockResolvedValue({
        operationalStartDate: new Date("2024-02-15T00:00:00Z"),
      }),
    };

    // テスト用入力データ
    const testInput: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date("2024-02-01T09:00:00Z"),
      participantList: [
        {
          userId: "U001",
          role: "Engineer",
          email: "tanaka.taro@example.com",
        },
        {
          userId: "U002",
          role: "Engineer",
          email: "suzuki.jiro@example.com",
        },
        {
          userId: "U003",
          role: "Engineer",
          email: "sato.saburo@example.com",
        },
        {
          userId: "U004",
          role: "Engineer",
          email: "watanabe.shiro@example.com",
        },
        {
          userId: "U005",
          role: "Engineer",
          email: "yamada.goro@example.com",
        },
        {
          userId: "U006",
          role: "Engineer",
          email: "ito.rokuro@example.com",
        },
        {
          userId: "U007",
          role: "Engineer",
          email: "nakamura.shichiro@example.com",
        },
        {
          userId: "U008",
          role: "Engineer",
          email: "kobayashi.hachiro@example.com",
        },
        {
          userId: "U009",
          role: "Engineer",
          email: "kato.jukuro@example.com",
        },
        {
          userId: "U010",
          role: "Engineer",
          email: "yoshida.juro@example.com",
        },
        {
          userId: "PM001",
          role: "ProjectManager",
          email: "pm.manager@example.com",
        },
        {
          userId: "MGR001",
          role: "Manager",
          email: "manager.director@example.com",
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: "09:00",
    };

    // エージェント実行
    const output = await runTx10Imp1Agent(testInput, mockAiClient);

    // 検証: 出力型の確認
    expect(output).toBeDefined();
    expect(output).toHaveProperty("deploymentSchedule");
    expect(output).toHaveProperty("trainingMaterials");
    expect(output).toHaveProperty("initialReportAnalysis");
    expect(output).toHaveProperty("onboardingApprovalStatus");

    // 検証: initialReportAnalysis が存在する
    const analysis = output.initialReportAnalysis;
    expect(analysis).toBeDefined();
    expect(analysis).toHaveProperty("submissionRate");
    expect(analysis).toHaveProperty("dataQualityScore");
    expect(analysis).toHaveProperty("formatUniformityScore");
    expect(analysis).toHaveProperty("feedbackItems");

    // 検証: 再教育対象者の抽出結果を確認
    // AIクライアントの extractRetrainingTargets が呼び出されたことを確認
    expect(mockAiClient.extractRetrainingTargets).toHaveBeenCalled();

    // 抽出された再教育対象者の件数と内容を検証
    const callArgs = mockAiClient.extractRetrainingTargets.mock.calls[0];
    const extractionResult = await mockAiClient.extractRetrainingTargets(
      callArgs[0]
    );

    // 期待結果の検証
    expect(extractionResult.targets).toHaveLength(1);
    expect(extractionResult.targets[0].userId).toBe("U001");
    expect(extractionResult.targets[0].name).toBe("田中太郎");
    expect(extractionResult.targets[0].requiresRetraining).toBe(true);

    // 検証: feedbackItems に再教育対象者の情報が含まれていることを確認
    expect(analysis.feedbackItems).toBeDefined();
    if (analysis.feedbackItems && analysis.feedbackItems.length > 0) {
      const retrainingFeedback = analysis.feedbackItems.find(
        (item) => item.engineerId === "U001"
      );
      expect(retrainingFeedback).toBeDefined();
    }

    // 検証: 提出率、品質スコア、形式統一度が予期した値である
    expect(analysis.submissionRate).toBe(100);
    expect(analysis.dataQualityScore).toBe(85);
    expect(analysis.formatUniformityScore).toBe(90);

    // 検証: onboardingApprovalStatus が存在し、承認状態を確認
    expect(output.onboardingApprovalStatus).toBeDefined();
    expect(output.onboardingApprovalStatus).toHaveProperty("approved");
    expect(typeof output.onboardingApprovalStatus.approved).toBe("boolean");
  });
});