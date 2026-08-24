import { generateAndSendConfirmationEmail, type ConfirmationEmailInput, type ConfirmationEmailOutput } from "../../src/logic/notification-delivery";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-434: [normal] 日報集約・課題抽出・優先度判定・確認メール生成配信機能 - 抽出された課題の影響度がチーム全体への波及度として正しく判定されている
  test("複数メンバーから報告された同一キーワード課題について、チーム波及度スコアが正しく計算され、75以上85以下の範囲で返される", async () => {
    // 準備: TextAnalysisServiceAdapterのスタブ化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        "データベース接続エラー": 3,
        "認証失敗": 1,
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        "データベース接続エラー": 75,
        "認証失敗": 45,
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        "データベース接続エラー": "高",
        "認証失敗": "中",
      }),
    };

    // 3名のチームメンバーから同じキーワード『データベース接続エラー』を含む課題報告
    const aggregatedReports = [
      {
        reportId: "report-001",
        reporterUserId: "user-001",
        reporterName: "田中太郎",
        yesterdayAccomplishment: "API仕様書の確認完了",
        todayPlan: "DB接続モジュール開発",
        challenges: "データベース接続エラーが頻発している。複数のクエリでタイムアウトが発生。",
        submissionDateTime: new Date("2024-01-15T08:15:00Z"),
      },
      {
        reportId: "report-002",
        reporterUserId: "user-002",
        reporterName: "鈴木花子",
        yesterdayAccomplishment: "テスト環境構築",
        todayPlan: "統合テスト実施",
        challenges: "データベース接続エラーにより本番環境との接続テストが進められていない。",
        submissionDateTime: new Date("2024-01-15T08:20:00Z"),
      },
      {
        reportId: "report-003",
        reporterUserId: "user-003",
        reporterName: "山田次郎",
        yesterdayAccomplishment: "ドキュメント作成",
        todayPlan: "リリース準備",
        challenges: "データベース接続エラーが原因でステージング環境でのデプロイが停止中。",
        submissionDateTime: new Date("2024-01-15T08:25:00Z"),
      },
    ];

    const confirmationEmailInput: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date("2024-01-15T09:00:00Z"),
      aggregatedReports,
      managerUserId: "manager-001",
      teamId: "team-dev-001",
      analysisDate: new Date("2024-01-15"),
    };

    // 実行
    const result: ConfirmationEmailOutput = await generateAndSendConfirmationEmail(
      confirmationEmailInput,
      mockTextAnalysisAdapter as any
    );

    // 検証: 波及度スコアが75以上85以下の範囲で返されていることを確認
    expect(result.prioritizedIssuesList).toBeDefined();
    expect(result.prioritizedIssuesList.length).toBeGreaterThan(0);

    const databaseErrorIssue = result.prioritizedIssuesList.find(
      (issue) => issue.issueContent.includes("データベース接続エラー")
    );
    expect(databaseErrorIssue).toBeDefined();
    expect(databaseErrorIssue!.impactScore).toBeGreaterThanOrEqual(75);
    expect(databaseErrorIssue!.impactScore).toBeLessThanOrEqual(85);

    // スコアが複数メンバーからの同一キーワード報告に基づいて計算されていることを確認
    // 3名から報告されているため、波及度が高い値になることを期待
    expect(databaseErrorIssue!.priorityRank).toBe("高");

    // TextAnalysisServiceAdapterが正しく呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    // 確認メールが正常に送信されたことを確認
    expect(result.emailId).toBeDefined();
    expect(result.sentDateTime).toBeDefined();
    expect(result.recipientEmail).toBeDefined();
  });
});