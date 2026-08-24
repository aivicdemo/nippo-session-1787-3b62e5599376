import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";

describe("朝会報告管理システム", () => {
  // SCEN-2628: [normal] 再教育対象者の抽出 - 再教育対象者が0人の場合、本運用へ移行判定が可能と判定される
  test("再教育対象者が0人の場合、本運用へ移行判定フラグが true になり、ダッシュボードに完了メッセージが表示される", async () => {
    // Setup: TextAnalysisServiceAdapterのスタブ化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        occurrenceFrequency: 0,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 45,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: "low",
      }),
    };

    // Setup: NotificationServiceAdapterのスタブ化
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "success",
        deliveredAt: new Date("2024-01-15T08:30:00Z"),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: "sched-001",
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "delivered",
      }),
    };

    // Setup: 過去7日間の日報データ（すべて70点以下で改善が見られる）
    const mockReportData = [
      {
        userId: "user-001",
        submissionDate: new Date("2024-01-08T09:15:00Z"),
        dataQualityScore: 85,
        formatUniformityScore: 88,
        contentAccuracy: "good",
      },
      {
        userId: "user-002",
        submissionDate: new Date("2024-01-09T09:10:00Z"),
        dataQualityScore: 78,
        formatUniformityScore: 82,
        contentAccuracy: "good",
      },
      {
        userId: "user-003",
        submissionDate: new Date("2024-01-10T09:05:00Z"),
        dataQualityScore: 92,
        formatUniformityScore: 90,
        contentAccuracy: "excellent",
      },
      {
        userId: "user-004",
        submissionDate: new Date("2024-01-11T09:20:00Z"),
        dataQualityScore: 88,
        formatUniformityScore: 85,
        contentAccuracy: "good",
      },
      {
        userId: "user-005",
        submissionDate: new Date("2024-01-12T09:12:00Z"),
        dataQualityScore: 80,
        formatUniformityScore: 79,
        contentAccuracy: "good",
      },
      {
        userId: "user-006",
        submissionDate: new Date("2024-01-13T09:08:00Z"),
        dataQualityScore: 75,
        formatUniformityScore: 76,
        contentAccuracy: "acceptable",
      },
      {
        userId: "user-007",
        submissionDate: new Date("2024-01-14T09:18:00Z"),
        dataQualityScore: 86,
        formatUniformityScore: 87,
        contentAccuracy: "good",
      },
    ];

    // Setup: 入力パラメータ
    const input = {
      deploymentInitiationTimestamp: new Date("2024-01-15T00:00:00Z"),
      participantList: [
        {
          userId: "user-001",
          role: "Engineer",
          email: "eng001@example.com",
        },
        {
          userId: "user-002",
          role: "Engineer",
          email: "eng002@example.com",
        },
        {
          userId: "user-003",
          role: "Engineer",
          email: "eng003@example.com",
        },
        {
          userId: "user-004",
          role: "Engineer",
          email: "eng004@example.com",
        },
        {
          userId: "user-005",
          role: "Engineer",
          email: "eng005@example.com",
        },
        {
          userId: "user-006",
          role: "Engineer",
          email: "eng006@example.com",
        },
        {
          userId: "user-007",
          role: "Engineer",
          email: "eng007@example.com",
        },
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
          userId: "manager-002",
          role: "Manager",
          email: "manager002@example.com",
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: "09:00",
    };

    // Execute: runTx10Imp1Agentを実行
    const result = await runTx10Imp1Agent(input, {
      textAnalysisAdapter: mockTextAnalysisAdapter,
      notificationAdapter: mockNotificationAdapter,
      reportDataProvider: async () => mockReportData,
    });

    // Assert: onboardingApprovalStatusが存在することを確認
    expect(result).toBeDefined();
    expect(result.onboardingApprovalStatus).toBeDefined();

    // Assert: 再教育対象者がいない場合、本運用移行判定フラグが true であることを確認
    expect(result.onboardingApprovalStatus.readyForProductionDeployment).toBe(
      true
    );

    // Assert: 再教育対象者のカウントが0であることを確認
    expect(result.onboardingApprovalStatus.remediationTargetCount).toBe(0);

    // Assert: 再教育対象者リストが空配列であることを確認
    expect(result.onboardingApprovalStatus.remediationTargetUsers).toEqual([]);

    // Assert: ダッシュボード用メッセージが正しく生成されていることを確認
    expect(
      result.onboardingApprovalStatus.dashboardMessage
    ).toMatch(/本運用移行準備完了.*再教育対象者.*0/);

    // Assert: initialReportAnalysisが存在することを確認
    expect(result.initialReportAnalysis).toBeDefined();

    // Assert: 提出率が期待値（7/10 = 70%）であることを確認
    expect(result.initialReportAnalysis.submissionRate).toBe(70);

    // Assert: データ品質スコアの平均値が期待値（85.7 ≈ 86）であることを確認
    const expectedQualityScore = Math.round(
      (85 + 78 + 92 + 88 + 80 + 75 + 86) / 7
    );
    expect(result.initialReportAnalysis.dataQualityScore).toBe(expectedQualityScore);

    // Assert: フォーマット統一度スコアの平均値が期待値（85.3 ≈ 85）であることを確認
    const expectedFormatScore = Math.round(
      (88 + 82 + 90 + 85 + 79 + 76 + 87) / 7
    );
    expect(result.initialReportAnalysis.formatUniformityScore).toBe(
      expectedFormatScore
    );

    // Assert: deploymentScheduleが存在することを確認
    expect(result.deploymentSchedule).toBeDefined();

    // Assert: trainingMaterialsが配列であることを確認
    expect(Array.isArray(result.trainingMaterials)).toBe(true);

    // Assert: TextAnalysisServiceAdapterが呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});