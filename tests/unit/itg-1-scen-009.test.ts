import { runTx3Imp1Agent, Tx3Imp1AiClient } from "../../src/agents/tx-3-imp-1/orchestrator";

describe("朝会報告管理システム - TX3エージェント", () => {
  // SCEN-009: 集約済み日報から課題を自動抽出し、優先度ルールに基づいて分類・判定し、優先度別一覧を作成してメール送信まで完結する
  test("should aggregate reports, extract prioritized issues, and send manager confirmation email successfully", async () => {
    // Mock aggregated reports data (10 members)
    const mockAggregatedReports = [
      {
        memberId: "emp-001",
        memberName: "田中太郎",
        yesterday: "API開発を進行",
        today: "バグ修正予定",
        issue: "ビルドが時々失敗する問題を抱えている",
        submittedAt: "2026-01-31T08:00:00Z",
      },
      {
        memberId: "emp-002",
        memberName: "鈴木花子",
        yesterday: "テスト作成完了",
        today: "レビュー対応",
        issue: "テスト環境が不安定で検証に時間がかかる",
        submittedAt: "2026-01-31T08:05:00Z",
      },
      {
        memberId: "emp-003",
        memberName: "佐藤次郎",
        yesterday: "ドキュメント更新",
        today: "チーム打ち合わせ",
        issue: "リソース不足でスケジュール遅延の懸念あり",
        submittedAt: "2026-01-31T08:10:00Z",
      },
      {
        memberId: "emp-004",
        memberName: "山田美咲",
        yesterday: "機能実装",
        today: "統合テスト",
        issue: "ビルドが時々失敗する問題が続いている",
        submittedAt: "2026-01-31T08:15:00Z",
      },
      {
        memberId: "emp-005",
        memberName: "加藤健一",
        yesterday: "バグ修正",
        today: "本番デプロイ",
        issue: "テスト環境の不具合で検証が遅れ気味",
        submittedAt: "2026-01-31T08:20:00Z",
      },
      {
        memberId: "emp-006",
        memberName: "高橋由美",
        yesterday: "設計審査参加",
        today: "開発進行",
        issue: "リソース不足で人手が足りない状況",
        submittedAt: "2026-01-31T08:25:00Z",
      },
      {
        memberId: "emp-007",
        memberName: "田村拓也",
        yesterday: "コードレビュー",
        today: "プルリクエスト対応",
        issue: "依存関係の解決が複雑になっている",
        submittedAt: "2026-01-31T08:30:00Z",
      },
      {
        memberId: "emp-008",
        memberName: "木村麻衣",
        yesterday: "CI/CD設定",
        today: "インフラ整備",
        issue: "ビルド失敗により デプロイが止まっている",
        submittedAt: "2026-01-31T08:35:00Z",
      },
      {
        memberId: "emp-009",
        memberName: "渡辺太一",
        yesterday: "監視設定作成",
        today: "ログ分析",
        issue: "テスト環境でタイムアウトエラーが発生",
        submittedAt: "2026-01-31T08:40:00Z",
      },
      {
        memberId: "emp-010",
        memberName: "中村春菜",
        yesterday: "セキュリティ監査",
        today: "脆弱性対応",
        issue: "リソース不足の影響で対応遅延中",
        submittedAt: "2026-01-31T08:45:00Z",
      },
    ];

    // Mock prioritized issues extracted and ranked by frequency and impact
    const mockPrioritizedIssues = [
      {
        keyword: "ビルド失敗",
        frequency: 3,
        impactScore: 75,
        priorityLevel: "high",
        affectedMemberCount: 3,
      },
      {
        keyword: "テスト環境不安定",
        frequency: 3,
        impactScore: 60,
        priorityLevel: "medium",
        affectedMemberCount: 3,
      },
      {
        keyword: "リソース不足",
        frequency: 3,
        impactScore: 50,
        priorityLevel: "medium",
        affectedMemberCount: 3,
      },
      {
        keyword: "スケジュール遅延",
        frequency: 2,
        impactScore: 40,
        priorityLevel: "low",
        affectedMemberCount: 2,
      },
      {
        keyword: "依存関係複雑化",
        frequency: 1,
        impactScore: 30,
        priorityLevel: "low",
        affectedMemberCount: 1,
      },
    ];

    // Mock email sending result
    const mockEmailSendingResult = {
      sendingStatus: "success",
      sentDateTime: "2026-01-31T09:00:00Z",
      messageId: "msg-20260131-001",
      errorMessage: undefined,
    };

    // Create test double AI client
    const mockAiClient: Tx3Imp1AiClient = {
      aggregateReportsByPeriod: jest
        .fn()
        .mockResolvedValue(mockAggregatedReports),
      extractAndRankIssuesFromReports: jest
        .fn()
        .mockResolvedValue(mockPrioritizedIssues),
      generateAndSendManagerConfirmationEmail: jest
        .fn()
        .mockResolvedValue(mockEmailSendingResult),
    };

    // Setup input parameters
    const input = {
      aggregationPeriodStartDate: "2026-01-01",
      aggregationPeriodEndDate: "2026-01-31",
      targetTeamIds: undefined,
      managerUserId: "manager-001",
    };

    // Call the agent function
    const result = await runTx3Imp1Agent(input, mockAiClient);

    // Validate execution status
    expect(result.executionStatus).toBe("success");

    // Validate extracted issue count
    expect(result.extractedIssueCount).toBe(5);

    // Validate prioritized issue list order (by impactScore descending: 75→60→50→40→30)
    expect(result.prioritizedIssueList).toHaveLength(5);
    expect(result.prioritizedIssueList[0].impactScore).toBe(75);
    expect(result.prioritizedIssueList[0].keyword).toBe("ビルド失敗");
    expect(result.prioritizedIssueList[1].impactScore).toBe(60);
    expect(result.prioritizedIssueList[1].keyword).toBe("テスト環境不安定");
    expect(result.prioritizedIssueList[2].impactScore).toBe(50);
    expect(result.prioritizedIssueList[2].keyword).toBe("リソース不足");
    expect(result.prioritizedIssueList[3].impactScore).toBe(40);
    expect(result.prioritizedIssueList[3].keyword).toBe("スケジュール遅延");
    expect(result.prioritizedIssueList[4].impactScore).toBe(30);
    expect(result.prioritizedIssueList[4].keyword).toBe("依存関係複雑化");

    // Validate email sending result
    expect(result.emailSendingResult.sendingStatus).toBe("success");
    expect(result.emailSendingResult.sentDateTime).toBe("2026-01-31T09:00:00Z");
    expect(result.emailSendingResult.messageId).toBe("msg-20260131-001");
    expect(result.emailSendingResult.errorMessage).toBeUndefined();

    // Verify that mocked methods were called with correct parameters
    expect(mockAiClient.aggregateReportsByPeriod).toHaveBeenCalledWith(
      "2026-01-01",
      "2026-01-31",
      undefined
    );
    expect(
      mockAiClient.extractAndRankIssuesFromReports
    ).toHaveBeenCalledWith(mockAggregatedReports);
    expect(
      mockAiClient.generateAndSendManagerConfirmationEmail
    ).toHaveBeenCalledWith(
      mockPrioritizedIssues,
      "manager-001",
      mockAggregatedReports
    );
  });
});