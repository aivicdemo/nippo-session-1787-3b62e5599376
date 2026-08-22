import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";

// Mock interfaces matching Tx2Imp1AiClient contract
interface MockAiActionResult {
  actionId: string;
  status: "success" | "failure";
  output: string;
  confidence: number;
}

interface Tx2Imp1AiClient {
  executeAction01(prompt: string): Promise<MockAiActionResult>;
  executeAction02(prompt: string): Promise<MockAiActionResult>;
  executeAction03(prompt: string): Promise<MockAiActionResult>;
  executeAction04(prompt: string): Promise<MockAiActionResult>;
  executeAction05(prompt: string): Promise<MockAiActionResult>;
  executeAction06(prompt: string): Promise<MockAiActionResult>;
}

interface MockEmailService {
  sendEmail(
    recipientEmail: string,
    subject: string,
    body: string
  ): Promise<{ mailId: string; sentAt: string }>;
}

interface MockReportDatabase {
  getAllReports(): Promise<
    Array<{
      memberId: string;
      memberName: string;
      reportContent: string;
      submittedAt: string;
    }>
  >;
}

describe("Tx2Imp1Agent: 日報収集から課題抽出・配信までの自律実行", () => {
  // SCEN-046
  it("should execute complete autonomous workflow from report collection to confirmation email delivery", async () => {
    // ============ Test Setup ============
    const executionTimestamp = new Date("2024-01-15T08:55:00Z");
    const reportingDeadline = new Date("2024-01-15T09:00:00Z");
    const managerEmail = "manager@example.com";
    const teamId = "team-001";

    // Mock member reports - 10 members all submitted
    const memberReports = [
      {
        memberId: "member-001",
        memberName: "Alice",
        reportContent:
          "昨日: DB最適化完了。今日: パフォーマンステスト実施。課題: メモリ使用率が予想より高い",
        submittedAt: "2024-01-15T08:30:00Z",
      },
      {
        memberId: "member-002",
        memberName: "Bob",
        reportContent:
          "昨日: API設計レビュー。今日: 実装開始予定。課題: レビュー指摘事項が多数存在",
        submittedAt: "2024-01-15T08:35:00Z",
      },
      {
        memberId: "member-003",
        memberName: "Charlie",
        reportContent:
          "昨日: テストケース作成。今日: テスト実行。課題: 環境構築で遅延発生中",
        submittedAt: "2024-01-15T08:40:00Z",
      },
      {
        memberId: "member-004",
        memberName: "Diana",
        reportContent:
          "昨日: ドキュメント作成。今日: チームレビュー。課題: なし",
        submittedAt: "2024-01-15T08:32:00Z",
      },
      {
        memberId: "member-005",
        memberName: "Eve",
        reportContent:
          "昨日: バグ修正。今日: 回帰テスト実施。課題: 顧客対応で予定変更あり",
        submittedAt: "2024-01-15T08:38:00Z",
      },
      {
        memberId: "member-006",
        memberName: "Frank",
        reportContent:
          "昨日: コードレビュー。今日: マージ予定。課題: マージコンフリクト発生",
        submittedAt: "2024-01-15T08:33:00Z",
      },
      {
        memberId: "member-007",
        memberName: "Grace",
        reportContent:
          "昨日: デプロイ準備。今日: 本番デプロイ。課題: インシデント報告2件",
        submittedAt: "2024-01-15T08:45:00Z",
      },
      {
        memberId: "member-008",
        memberName: "Henry",
        reportContent:
          "昨日: 監視ダッシュボード改良。今日: アラート設定調整。課題: なし",
        submittedAt: "2024-01-15T08:31:00Z",
      },
      {
        memberId: "member-009",
        memberName: "Ivy",
        reportContent:
          "昨日: ユーザー調査実施。今日: 分析開始。課題: データ品質問題が判明",
        submittedAt: "2024-01-15T08:42:00Z",
      },
      {
        memberId: "member-010",
        memberName: "Jack",
        reportContent:
          "昨日: スプリント計画。今日: バックログ整理。課題: 優先度の再調整が必要",
        submittedAt: "2024-01-15T08:37:00Z",
      },
    ];

    // Mock AI Client
    const mockAiClient: Tx2Imp1AiClient = {
      executeAction01: jest
        .fn()
        .mockResolvedValue({
          actionId: "action-01",
          status: "success",
          output:
            "全10名のメンバーから日報受信確認完了。未提出メンバーなし。",
          confidence: 0.98,
        } as MockAiActionResult),

      executeAction02: jest
        .fn()
        .mockResolvedValue({
          actionId: "action-02",
          status: "success",
          output:
            "10件の日報を統一フォーマット(昨日やったこと/今日やること/抱えている課題)に変換完了。全て形式正常。",
          confidence: 0.97,
        } as MockAiActionResult),

      executeAction03: jest
        .fn()
        .mockResolvedValue({
          actionId: "action-03",
          status: "success",
          output:
            "課題抽出完了: 高優先度3件(インシデント2件、マージコンフリクト1件)、中優先度5件(パフォーマンス問題1件、レビュー指摘事項1件、環境構築遅延1件、顧客対応1件、優先度調整必要1件)、低優先度2件(その他2件)。合計10件。個人情報マスキング適用済み。",
          confidence: 0.96,
        } as MockAiActionResult),

      executeAction04: jest
        .fn()
        .mockResolvedValue({
          actionId: "action-04",
          status: "success",
          output:
            "課題優先度別色分け処理完了。高優先度(赤):3件、中優先度(黄):5件、低優先度(緑):2件。",
          confidence: 0.95,
        } as MockAiActionResult),

      executeAction05: jest
        .fn()
        .mockResolvedValue({
          actionId: "action-05",
          status: "success",
          output: "未提出メンバー特定完了: 0名(全員提出済み)",
          confidence: 0.99,
        } as MockAiActionResult),

      executeAction06: jest
        .fn()
        .mockResolvedValue({
          actionId: "action-06",
          status: "success",
          output:
            "確認メール本文自動生成完了。統一フォーマット日報要約10件、優先度別課題リスト、未提出者なし。受信者: manager@example.com",
          confidence: 0.98,
        } as MockAiActionResult),
    };

    // Mock Email Service
    const emailSentAt = new Date("2024-01-15T08:55:30Z").toISOString();
    const mockEmailService: MockEmailService = {
      sendEmail: jest.fn().mockResolvedValue({
        mailId: "mail-tx2-20240115-001",
        sentAt: emailSentAt,
      }),
    };

    // Mock Report Database
    const mockReportDatabase: MockReportDatabase = {
      getAllReports: jest.fn().mockResolvedValue(memberReports),
    };

    // ============ Execute Agent ============
    const result = await runTx2Imp1Agent(
      {
        executionTimestamp,
        teamId,
        reportingDeadline,
        managerEmail,
      },
      mockAiClient,
      mockEmailService,
      mockReportDatabase
    );

    // ============ Assertions ============
    // 1. Verify all 6 AI actions were executed in order
    expect(mockAiClient.executeAction01).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction02).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction03).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction04).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction05).toHaveBeenCalledTimes(1);
    expect(mockAiClient.executeAction06).toHaveBeenCalledTimes(1);

    // 2. Verify email was sent exactly once to manager
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
    const emailCall = (mockEmailService.sendEmail as jest.Mock).mock.calls[0];
    expect(emailCall[0]).toBe(managerEmail);
    expect(typeof emailCall[1]).toBe("string");
    expect(typeof emailCall[2]).toBe("string");

    // 3. Verify report database was queried
    expect(mockReportDatabase.getAllReports).toHaveBeenCalledTimes(1);

    // 4. Verify return value structure and values
    expect(result.status).toBe("success");
    expect(result.processedReportsCount).toBe(10);
    expect(result.extractedIssuesCount).toBe(10);
    expect(result.mailSentId).toBe("mail-tx2-20240115-001");

    // 5. Verify timestamp is within acceptable range (±10 seconds)
    const returnedTimestamp = new Date(result.timestamp).getTime();
    const executionTime = new Date("2024-01-15T08:55:30Z").getTime();
    const timeDiffMs = Math.abs(returnedTimestamp - executionTime);
    expect(timeDiffMs).toBeLessThanOrEqual(10000);

    // 6. Verify email content contains expected elements
    const emailBody = emailCall[2];
    expect(emailBody).toContain("統一フォーマット");
    expect(emailBody).toContain("優先度別");
    expect(emailBody).toContain("高優先度");
    expect(emailBody).toContain("中優先度");
    expect(emailBody).toContain("低優先度");

    // 7. Verify no personal details beyond names are exposed
    // Email should not contain specific personal identifiers beyond necessary member names
    expect(emailBody).not.toMatch(/\d{3}-\d{4}-\d{4}/); // no phone patterns
    expect(emailBody).not.toMatch(/\d{1,2}月\d{1,2}日/); // no personal dates

    // 8. Verify prioritized issues are included in expected format
    expect(emailBody).toContain("3件"); // 3 high priority issues
    expect(emailBody).toContain("5件"); // 5 medium priority issues
    expect(emailBody).toContain("2件"); // 2 low priority issues
  });
});