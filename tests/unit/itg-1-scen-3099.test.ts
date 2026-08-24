import { runTx2Imp1Agent, type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from "../../src/agents/tx-2-imp-1/prompts/action-03";
import type { Tx2Imp1AgentInput, Tx2Imp1AgentOutput } from "../../src/agents/tx-2-imp-1/orchestrator";

// Mock TextAnalysisServiceAdapter
const mockTextAnalysisServiceAdapter = {
  extractKeywords: jest.fn(),
  assessImpactScore: jest.fn(),
  classifyIssueSeverity: jest.fn(),
};

describe("tx-2-imp-1: 日報収集から課題抽出・配信までの自律実行", () => {
  // SCEN-3099
  test("action-03テキスト解析で課題・リスク・成果を自動抽出する - 抽出課題が正しく構造化され次のステップへ受け渡される", async () => {
    // Setup: テスト用日報データセット（3件の統一フォーマット日報）
    const testReports = [
      {
        memberId: "member-001",
        reportDate: new Date("2024-01-15"),
        yesterday: "API認証機能の実装完了",
        today: "ユーザー管理画面の開発開始",
        challenges: "データベース接続タイムアウトが頻発している。対応が必要",
      },
      {
        memberId: "member-002",
        reportDate: new Date("2024-01-15"),
        yesterday: "テスト自動化スクリプト作成",
        today: "CI/CD パイプラインの設定",
        challenges: "ステージング環境でビルドが失敗。原因調査中",
      },
      {
        memberId: "member-003",
        reportDate: new Date("2024-01-15"),
        yesterday: "ドキュメント更新",
        today: "チームミーティング参加",
        challenges: "顧客からの仕様変更要求が急増。優先順位付けが必要",
      },
    ];

    // Setup: TextAnalysisServiceAdapter の stub を mock
    mockTextAnalysisServiceAdapter.extractKeywords.mockImplementation((text: string) => {
      if (text.includes("タイムアウト")) {
        return ["データベース接続", "タイムアウト"];
      }
      if (text.includes("ビルド")) {
        return ["ビルド失敗", "ステージング環境"];
      }
      if (text.includes("仕様変更")) {
        return ["仕様変更", "優先順位"];
      }
      return [];
    });

    mockTextAnalysisServiceAdapter.assessImpactScore.mockImplementation((keyword: string) => {
      if (keyword.includes("タイムアウト")) return 85;
      if (keyword.includes("ビルド")) return 72;
      if (keyword.includes("仕様変更")) return 65;
      return 50;
    });

    mockTextAnalysisServiceAdapter.classifyIssueSeverity.mockImplementation((keyword: string) => {
      if (keyword.includes("タイムアウト")) return "高";
      if (keyword.includes("ビルド")) return "中";
      if (keyword.includes("仕様変更")) return "中";
      return "低";
    });

    // Setup: Tx2Imp1AiClient の mock
    const mockAiClient: Tx2Imp1AiClient = {
      callAction01: jest.fn().mockResolvedValue({
        aggregatedReports: testReports.map((r) => ({
          memberId: r.memberId,
          reportDate: r.reportDate,
          yesterday: r.yesterday,
          today: r.today,
          challenges: r.challenges,
        })),
        unsubmittedMemberIds: [],
      }),
      callAction02: jest.fn().mockResolvedValue({
        unifiedReports: testReports,
      }),
      callAction03: jest.fn().mockImplementation(async (prompt: string) => {
        // action-03: テキスト解析で課題・リスク・成果を自動抽出
        const extractedIssues = [];
        for (const report of testReports) {
          const keywords = mockTextAnalysisServiceAdapter.extractKeywords(report.challenges);
          for (const keyword of keywords) {
            const impactScore = mockTextAnalysisServiceAdapter.assessImpactScore(keyword);
            const severity = mockTextAnalysisServiceAdapter.classifyIssueSeverity(keyword);
            extractedIssues.push({
              keyword,
              impactScore,
              severity,
              sourceReportId: report.memberId,
            });
          }
        }
        return {
          extractedIssues,
          extractionTimestamp: new Date("2024-01-15T09:30:00Z"),
        };
      }),
      callAction04: jest.fn().mockResolvedValue({
        colorizedIssues: [
          { keyword: "データベース接続", color: "red", score: 85 },
          { keyword: "ビルド失敗", color: "yellow", score: 72 },
          { keyword: "仕様変更", color: "yellow", score: 65 },
        ],
      }),
      callAction05: jest.fn().mockResolvedValue({
        mailContent: {
          reportDate: new Date("2024-01-15"),
          submissionSummary: "提出済み: 3件 / 未提出: 0件",
          topPriorityChallenges: [
            { keyword: "データベース接続", score: 85, severity: "高" },
            { keyword: "ビルド失敗", score: 72, severity: "中" },
          ],
        },
      }),
      callAction06: jest.fn().mockResolvedValue({
        emailSent: true,
        deliveryTimestamp: new Date("2024-01-15T09:35:00Z"),
      }),
    };

    // Setup: エージェント入力
    const agentInput: Tx2Imp1AgentInput = {
      executionTimestamp: new Date("2024-01-15T09:00:00Z"),
      reportDeadlineTime: new Date("2024-01-15T09:00:00Z"),
      targetTeamIds: ["team-001"],
      managerUserIds: ["manager-001"],
    };

    // Execute: runTx2Imp1Agent を実行
    const result = await runTx2Imp1Agent(agentInput, mockAiClient);

    // Verify: action-03 が呼び出されたことを確認
    expect(mockAiClient.callAction03).toHaveBeenCalled();

    // Verify: TextAnalysisServiceAdapter の各メソッドが呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    // Verify: 抽出課題が正しく構造化されている
    expect(result).toBeDefined();
    expect(result.extractedIssueCount).toBeGreaterThan(0);
    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);

    // Verify: 抽出課題のプロパティが正しい形式
    if (result.prioritizedIssues.length > 0) {
      const firstIssue = result.prioritizedIssues[0];
      expect(typeof firstIssue.keyword).toBe("string");
      expect(typeof firstIssue.impactScore).toBe("number");
      expect(firstIssue.impactScore).toBeGreaterThanOrEqual(0);
      expect(firstIssue.impactScore).toBeLessThanOrEqual(100);
      expect(["高", "中", "低"]).toContain(firstIssue.severity);
    }

    // Verify: 抽出件数が期待値と一致
    expect(result.extractedIssueCount).toBe(3);

    // Verify: 優先度別課題一覧が次のステップへ正常に受け渡された
    expect(mockAiClient.callAction04).toHaveBeenCalled();

    // Verify: 確認メール配信が実行された
    expect(mockAiClient.callAction05).toHaveBeenCalled();
    expect(mockAiClient.callAction06).toHaveBeenCalled();

    // Verify: 確認メール送信成功フラグが true
    expect(result.confirmationEmailSent).toBe(true);

    // Verify: AIクライアントのパラメータが型定義と一致
    expect(typeof result.aggregatedReportCount).toBe("number");
    expect(typeof result.extractedIssueCount).toBe("number");
    expect(typeof result.confirmationEmailSent).toBe("boolean");

    // Verify: prompt モジュールが正しくエクスポートされている
    expect(typeof buildAction03Prompt).toBe("function");
    expect(typeof ACTION_03_PROMPT_VERSION).toBe("string");

    // Cleanup: mock の呼び出し履歴をクリア
    jest.clearAllMocks();
  });
});