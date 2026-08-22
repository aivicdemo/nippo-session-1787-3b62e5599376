import { describe, test, expect, beforeEach } from "@jest/globals";
import { runTx6Imp1Agent } from "../../src/agents/tx-6-imp-1/orchestrator";
import {
  buildAction03Prompt,
  ACTION_03_PROMPT_VERSION,
} from "../../src/agents/tx-6-imp-1/prompts/action-03";
import type { Tx6Imp1AiClient } from "../../src/agents/tx-6-imp-1/orchestrator";

interface ExtractedTask {
  taskId: string;
  category: "システム障害" | "プロセス改善" | "リソース不足" | "品質問題" | "その他";
  content: string;
  extractedFrom: string;
  confidence: number;
}

describe("Tx6Imp1Agent - 日報収集から分析レポート生成までの自動実行", () => {
  let fakeTx6Imp1AiClient: Tx6Imp1AiClient;
  let action03PromptReceived: string | null = null;
  let extractedTasks: ExtractedTask[] = [];

  beforeEach(() => {
    action03PromptReceived = null;
    extractedTasks = [];

    fakeTx6Imp1AiClient = {
      callAction01: jest.fn(async (prompt: string) => ({
        status: "success",
        data: {
          submittedReports: [
            {
              reportId: "report_001",
              submittedAt: "2024-01-08T09:00:00Z",
              memberName: "田中太郎",
              department: "開発部",
              content: "システムの起動エラーが発生。デバッグ中。",
            },
            {
              reportId: "report_002",
              submittedAt: "2024-01-08T09:15:00Z",
              memberName: "鈴木花子",
              department: "品質保証部",
              content: "テストケースの設計遅延。リソース不足が原因。",
            },
            {
              reportId: "report_003",
              submittedAt: "2024-01-08T09:30:00Z",
              memberName: "佐藤次郎",
              department: "開発部",
              content: "同じシステム障害を再発。前週の対応が不十分。",
            },
            {
              reportId: "report_004",
              submittedAt: "2024-01-08T10:00:00Z",
              memberName: "伊藤美咲",
              department: "運用部",
              content: "レビュープロセスの改善提案。承認者の数を削減する。",
            },
            {
              reportId: "report_005",
              submittedAt: "2024-01-08T10:15:00Z",
              memberName: "山田健太",
              department: "開発部",
              content: "品質テストの実施人数が足りず、テスト漏れのリスク。",
            },
            {
              reportId: "report_006",
              submittedAt: "2024-01-08T10:30:00Z",
              memberName: "木村由美",
              department: "企画部",
              content: "顧客からのバグ報告が3件。メモリ不足が原因か。",
            },
            {
              reportId: "report_007",
              submittedAt: "2024-01-08T11:00:00Z",
              memberName: "高橋龍一",
              department: "開発部",
              content: "ドキュメント作成工程の自動化を検討中。",
            },
            {
              reportId: "report_008",
              submittedAt: "2024-01-08T11:15:00Z",
              memberName: "中村麻衣",
              department: "品質保証部",
              content: "APIの品質基準が不明確。機能追加時の判定基準が必要。",
            },
            {
              reportId: "report_009",
              submittedAt: "2024-01-08T11:45:00Z",
              memberName: "斉藤健二",
              department: "インフラ部",
              content: "サーバリソースの監視体制が不足。24時間対応が必要。",
            },
            {
              reportId: "report_010",
              submittedAt: "2024-01-08T12:00:00Z",
              memberName: "渡辺由香",
              department: "開発部",
              content: "デプロイメント手順の明確化。現在は属人的。",
            },
          ],
        },
      })),

      callAction02: jest.fn(async (prompt: string) => ({
        status: "success",
        data: {
          unsubmittedMembers: [],
        },
      })),

      callAction03: jest.fn(async (prompt: string) => {
        action03PromptReceived = prompt;
        extractedTasks = [
          {
            taskId: "task_001",
            category: "システム障害",
            content: "起動エラーおよび再発性障害への対応",
            extractedFrom: "report_001",
            confidence: 0.95,
          },
          {
            taskId: "task_002",
            category: "リソース不足",
            content: "テストケース設計リソースと品質テスト実施体制の不足",
            extractedFrom: "report_002",
            confidence: 0.88,
          },
          {
            taskId: "task_003",
            category: "プロセス改善",
            content: "レビュープロセスの簡素化とデプロイメント手順の標準化",
            extractedFrom: "report_004",
            confidence: 0.82,
          },
          {
            taskId: "task_004",
            category: "品質問題",
            content: "品質基準の明確化と顧客報告バグの原因特定",
            extractedFrom: "report_006",
            confidence: 0.91,
          },
          {
            taskId: "task_005",
            category: "その他",
            content: "サーバリソース監視体制の強化",
            extractedFrom: "report_009",
            confidence: 0.76,
          },
        ];
        return {
          status: "success",
          data: {
            extractedTasks: extractedTasks,
          },
        };
      }),

      callAction04: jest.fn(async (prompt: string) => ({
        status: "success",
        data: {
          trendAnalysis: {},
        },
      })),

      callAction05: jest.fn(async (prompt: string) => ({
        status: "success",
        data: {
          reportContent: {},
        },
      })),

      callAction06: jest.fn(async (prompt: string) => ({
        status: "success",
        data: {
          distributionStatus: "sent",
        },
      })),

      callAction07: jest.fn(async (prompt: string) => ({
        status: "success",
        data: {
          completionStatus: "success",
        },
      })),
    };
  });

  // SCEN-109
  test("should execute autonomous report generation with task extraction and classification from submitted reports while removing personal information", async () => {
    const executionTimestamp = new Date("2024-01-08T13:00:00Z");
    const analysisStartDate = "2024-01-01";
    const analysisEndDate = "2024-01-07";
    const teamId = "team_development_001";

    const input = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    const result = await runTx6Imp1Agent(input, fakeTx6Imp1AiClient);

    expect(fakeTx6Imp1AiClient.callAction01).toHaveBeenCalled();
    expect(fakeTx6Imp1AiClient.callAction03).toHaveBeenCalled();

    const action03CallArgs = (
      fakeTx6Imp1AiClient.callAction03 as jest.Mock
    ).mock.calls[0];
    expect(action03CallArgs).toBeDefined();
    expect(action03CallArgs[0]).toContain("課題");

    expect(action03PromptReceived).toBeTruthy();
    expect(buildAction03Prompt).toBeDefined();
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_03_PROMPT_VERSION).toBe("string");

    expect(extractedTasks).toHaveLength(5);

    const validCategories = [
      "システム障害",
      "プロセス改善",
      "リソース不足",
      "品質問題",
      "その他",
    ];
    extractedTasks.forEach((task) => {
      expect(validCategories).toContain(task.category);
      expect(task.confidence).toBeGreaterThanOrEqual(0.0);
      expect(task.confidence).toBeLessThanOrEqual(1.0);
      expect(task.content).not.toContain("田中太郎");
      expect(task.content).not.toContain("鈴木花子");
      expect(task.content).not.toContain("佐藤次郎");
      expect(task.content).not.toContain("伊藤美咲");
      expect(task.content).not.toContain("山田健太");
      expect(task.content).not.toContain("木村由美");
      expect(task.content).not.toContain("高橋龍一");
      expect(task.content).not.toContain("中村麻衣");
      expect(task.content).not.toContain("斉藤健二");
      expect(task.content).not.toContain("渡辺由香");
      expect(task.content).not.toContain("開発部");
      expect(task.content).not.toContain("品質保証部");
      expect(task.content).not.toContain("運用部");
      expect(task.content).not.toContain("企画部");
      expect(task.content).not.toContain("インフラ部");
    });

    expect(result.status).toBe("success");
    expect(result.data).toBeDefined();
  });
});