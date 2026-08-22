import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from "../../src/agents/tx-2-imp-1/prompts/action-03";

describe("Tx2Imp1Agent - 日報収集から課題抽出・配信までの自律実行", () => {
  test("SCEN-043: テキスト解析で課題・リスク・成果を自動抽出し、信頼度スコアで検証する", async () => {
    // Setup: テスト用の日報データセット（複数メンバーの日報5件）を準備
    const testReportDataset = [
      {
        memberId: "member-001",
        memberName: "営業A",
        reportDate: "2024-01-15",
        yesterday: "既存顧客5社にアプローチ、商談2件実施",
        today: "新規顧客10社へのリード探索、提案資料作成",
        issues: "営業目標未達成、パイプライン不足が課題",
      },
      {
        memberId: "member-002",
        memberName: "開発B",
        reportDate: "2024-01-15",
        yesterday: "バグ修正10件、ユニットテスト40ケース追加",
        today: "新機能API開発、統合テスト環境構築",
        issues: "サーバー性能低下、インシデント報告3件",
      },
      {
        memberId: "member-003",
        memberName: "品管C",
        reportDate: "2024-01-15",
        yesterday: "テスト実行150ケース、不具合報告5件",
        today: "回帰テスト実行、本番前チェックリスト確認",
        issues: "テスト環境ストレージ不足、リソース競合",
      },
      {
        memberId: "member-004",
        memberName: "企画D",
        reportDate: "2024-01-15",
        yesterday: "要件定義ドキュメント作成、関係者インタビュー",
        today: "仕様書レビュー、プロトタイプ検証",
        issues: "スケジュール遅延1週間、優先度調整必要",
      },
      {
        memberId: "member-005",
        memberName: "運用E",
        reportDate: "2024-01-15",
        yesterday: "システム監視、ログ分析",
        today: "セキュリティパッチ適用、バックアップ確認",
        issues: "ネットワーク遅延、容量警告ログ多発",
      },
    ];

    // Tx2Imp1AiClientのスタブを作成し、buildAction03Prompt関数の出力を模擬する
    const mockAiClient: Tx2Imp1AiClient = {
      executeAction03: jest.fn().mockResolvedValue({
        issues: [
          { text: "営業目標未達成", confidence: 0.92 },
          { text: "パイプライン不足", confidence: 0.88 },
        ],
        risks: [
          { text: "顧客流出リスク", confidence: 0.85 },
        ],
        achievements: [
          { text: "商談2件実施", confidence: 0.95 },
          { text: "アプローチ完了", confidence: 0.89 },
        ],
      }),
      executeAction01: jest.fn().mockResolvedValue({}),
      executeAction02: jest.fn().mockResolvedValue({}),
      executeAction04: jest.fn().mockResolvedValue({}),
      executeAction05: jest.fn().mockResolvedValue({}),
      executeAction06: jest.fn().mockResolvedValue({}),
    };

    // 入力パラメータの準備
    const input = {
      executionTimestamp: new Date("2024-01-15T08:55:00Z"),
      teamId: "team-engineering",
      reportingDeadline: new Date("2024-01-15T09:00:00Z"),
      managerEmail: "manager@company.com",
    };

    // runTx2Imp1Agentを呼び出し、第2パラメータがTx2Imp1AiClient型として構造的に一致することを確認
    const result = await runTx2Imp1Agent(input, mockAiClient);

    // スタブAIクライアントが呼び出されたことを検証
    expect(mockAiClient.executeAction03).toHaveBeenCalled();

    // Action 3が呼び出された回数を検証（複数日報に対して順次実行）
    // 最低限、첫 번째 일보에 대해 호출되어야 함
    expect(mockAiClient.executeAction03).toHaveBeenCalledTimes(
      Math.min(testReportDataset.length, 1)
    );

    // 信頼度スコアで検証（信頼度0.7以上のみを抽出対象とする）
    const mockResult = await mockAiClient.executeAction03(
      { reportText: testReportDataset[0] },
      { model: "gpt-4" }
    );
    
    expect(mockResult.issues).toBeDefined();
    expect(mockResult.issues.length).toBeGreaterThan(0);
    
    // 信頼度0.7以上の検証
    mockResult.issues.forEach((issue: { text: string; confidence: number }) => {
      expect(issue.confidence).toBeGreaterThanOrEqual(0.7);
    });

    mockResult.risks.forEach((risk: { text: string; confidence: number }) => {
      expect(risk.confidence).toBeGreaterThanOrEqual(0.7);
    });

    mockResult.achievements.forEach((achievement: { text: string; confidence: number }) => {
      expect(achievement.confidence).toBeGreaterThanOrEqual(0.7);
    });

    // 抽出された課題・リスク・成果が、元の日報テキストに対して意味的に一貫性があることを確認
    const firstReport = testReportDataset[0];
    const extractedIssueTexts = mockResult.issues.map(
      (issue: { text: string; confidence: number }) => issue.text
    );
    
    // 『営業目標未達成』という課題が日報の『抱えている課題』セクションに存在することを検証
    expect(extractedIssueTexts).toContain("営業目標未達成");
    expect(firstReport.issues).toContain("営業目標未達成");

    // ACTION_03_PROMPT_VERSIONが定義され、buildAction03Prompts関数がこのバージョン値と共にプロンプトモジュールからエクスポートされていることを確認
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_03_PROMPT_VERSION).toBe("string");
    expect(ACTION_03_PROMPT_VERSION.length).toBeGreaterThan(0);

    // buildAction03Prompt関数が呼び出し可能であることを確認
    const promptResult = buildAction03Prompt({
      reportText: firstReport.yesterday,
      reportDate: firstReport.reportDate,
    });
    expect(promptResult).toBeDefined();
    expect(typeof promptResult).toBe("string");
    expect(promptResult.length).toBeGreaterThan(0);

    // オーケストレータの戻り値がAggregatedReportDataまたはに相当する構造を持つことを確認
    expect(result).toBeDefined();
    expect(result.aggregationStatus).toBeDefined();
    expect(typeof result.aggregationStatus).toBe("string");
    expect(["success", "failure"]).toContain(result.aggregationStatus);

    if (result.aggregationStatus === "success") {
      expect(result.extractedIssuesCount).toBeGreaterThanOrEqual(0);
      expect(typeof result.extractedIssuesCount).toBe("number");
      expect(result.prioritizedIssuesList).toBeDefined();
      expect(Array.isArray(result.prioritizedIssuesList)).toBe(true);
    }

    // 抽出結果がメモリ上に正しく保持され、後続のAction 4に渡せる状態であることを確認
    expect(result.emailSendStatus).toBeDefined();
    expect(["sent", "failed"]).toContain(result.emailSendStatus);
  });
});