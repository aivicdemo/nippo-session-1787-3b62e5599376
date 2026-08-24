import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";

describe("朝会報告初期導入 - 初回テスト報告データ品質評価", () => {
  // SCEN-2588: [error] 初回報告データ品質評価機能 - データ品質スコアが null のとき評価処理がエラーになる
  test("should throw error and log when assessImpactScore returns null", async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ["keyword1", "keyword2"],
        frequency: [2, 1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(null),
      classifyIssueSeverity: jest.fn().mockResolvedValue("high"),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ status: "sent" }),
      scheduleNotification: jest
        .fn()
        .mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest
        .fn()
        .mockResolvedValue({ delivered: true }),
    };

    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const input = {
      deploymentInitiationTimestamp: new Date("2024-01-15T09:00:00Z"),
      participantList: [
        {
          userId: "PM001",
          role: "ProjectManager",
          email: "pm@example.com",
        },
        {
          userId: "MGR001",
          role: "Manager",
          email: "manager@example.com",
        },
        {
          userId: "ENG001",
          role: "Engineer",
          email: "eng001@example.com",
        },
        {
          userId: "ENG002",
          role: "Engineer",
          email: "eng002@example.com",
        },
        {
          userId: "ENG003",
          role: "Engineer",
          email: "eng003@example.com",
        },
        {
          userId: "ENG004",
          role: "Engineer",
          email: "eng004@example.com",
        },
        {
          userId: "ENG005",
          role: "Engineer",
          email: "eng005@example.com",
        },
        {
          userId: "ENG006",
          role: "Engineer",
          email: "eng006@example.com",
        },
        {
          userId: "ENG007",
          role: "Engineer",
          email: "eng007@example.com",
        },
        {
          userId: "ENG008",
          role: "Engineer",
          email: "eng008@example.com",
        },
        {
          userId: "ENG009",
          role: "Engineer",
          email: "eng009@example.com",
        },
        {
          userId: "ENG010",
          role: "Engineer",
          email: "eng010@example.com",
        },
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: "09:00",
    };

    const testReportData = {
      engineerId: "ENG001",
      yesterdayAccomplishment: "完成した機能のテストと修正",
      todayPlans: "新機能の開発を開始する",
      issuesToAddress: "DBアクセス速度の問題が発生",
      submissionTimestamp: new Date("2024-01-15T08:30:00Z"),
    };

    await expect(
      runTx10Imp1Agent(input, {
        textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
        notificationServiceAdapter: mockNotificationServiceAdapter,
        logger: mockLogger,
        testReportData: testReportData,
      })
    ).rejects.toThrow(/チーム波及度スコア/);

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("チーム波及度スコア")
    );
  });
});