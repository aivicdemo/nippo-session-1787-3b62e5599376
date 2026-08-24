import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";

describe("朝会報告アプリ初期導入・ユーザー教育 - tx_10_imp_1", () => {
  // SCEN-2632: [normal] 再テスト報告の合格判定 - 再テスト報告が合格基準に達していない場合、不合格と判定される
  test("SCEN-2632: 再テスト報告が合格基準を満たさない場合、不合格と判定される", async () => {
    // Setup: 初回テスト報告が不合格と判定された状況を作成
    const initialReportSubmissionTimestamp = new Date("2024-06-10T09:30:00Z");
    const retestReportSubmissionTimestamp = new Date("2024-06-10T14:15:00Z");

    const participantList = [
      {
        userId: "ENG001",
        role: "Engineer",
        email: "engineer001@example.com",
      },
      {
        userId: "ENG002",
        role: "Engineer",
        email: "engineer002@example.com",
      },
      {
        userId: "ENG003",
        role: "Engineer",
        email: "engineer003@example.com",
      },
      {
        userId: "ENG004",
        role: "Engineer",
        email: "engineer004@example.com",
      },
      {
        userId: "ENG005",
        role: "Engineer",
        email: "engineer005@example.com",
      },
      {
        userId: "ENG006",
        role: "Engineer",
        email: "engineer006@example.com",
      },
      {
        userId: "ENG007",
        role: "Engineer",
        email: "engineer007@example.com",
      },
      {
        userId: "ENG008",
        role: "Engineer",
        email: "engineer008@example.com",
      },
      {
        userId: "ENG009",
        role: "Engineer",
        email: "engineer009@example.com",
      },
      {
        userId: "ENG010",
        role: "Engineer",
        email: "engineer010@example.com",
      },
      {
        userId: "MGR001",
        role: "Manager",
        email: "manager001@example.com",
      },
      {
        userId: "PM001",
        role: "ProjectManager",
        email: "pm001@example.com",
      },
    ];

    // 初回テスト報告：合格基準未満のデータ
    const initialReportData = {
      yesterdayWork:
        "バグ修正対応",
      todayWork:
        "新機能開発検討",
      challenges:
        "API設計",
    };

    // 再テスト報告：合格基準未満のデータ
    const retestReportData = {
      yesterdayWork:
        "テスト実施",
      todayWork:
        "リリース準備",
      challenges:
        "パフォーマンス最適化",
    };

    // Mock TextAnalysisServiceAdapter - 合格基準未満のスコアを返す
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ["テスト", "リリース"],
        frequency: [1, 1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(45), // 基準値80未満
      classifyIssueSeverity: jest.fn().mockResolvedValue("low"),
    };

    // Mock NotificationServiceAdapter
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockResolvedValue({ status: "sent" }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduledId: "123" }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: false }),
    };

    // Input for tx_10_imp_1
    const tx10Input = {
      deploymentInitiationTimestamp: new Date("2024-06-01T08:00:00Z"),
      participantList: participantList,
      preparationDaysRequired: 5,
      reportingDeadlineTime: "09:00",
    };

    // Execute: runTx10Imp1Agent を呼び出し
    const result = await runTx10Imp1Agent(tx10Input, {
      textAnalysisService: mockTextAnalysisServiceAdapter,
      notificationService: mockNotificationServiceAdapter,
    });

    // Verify: 再テスト報告が不合格と判定されたことを確認
    expect(result).toBeDefined();
    expect(result.onboardingApprovalStatus).toBeDefined();

    // 合格判定の結果を検証
    // ビジネスルール: 提出率90%以上・データ品質スコア80点以上・形式統一度85%以上の3条件をすべて満たす必要がある
    // 本テストでは品質スコアが45（80未満）のため、不合格となる
    expect(result.initialReportAnalysis.dataQualityScore).toBeLessThan(80);

    // 不合格ステータスが記録されたことを確認
    // ビジネスルール: 『再テスト_不合格』というステータスが記録される
    expect(result.onboardingApprovalStatus.status).toBe("再テスト_不合格");

    // エラーメッセージが含まれていることを確認
    expect(result.onboardingApprovalStatus.feedbackMessage).toMatch(
      /課題内容が合格基準に達していません/
    );

    // TextAnalysisServiceAdapterが呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();

    // 通知サービスが呼び出されなかったことを確認（不合格のため配信しない）
    expect(
      mockNotificationServiceAdapter.sendReminderNotification
    ).not.toHaveBeenCalled();
  });
});