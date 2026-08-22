import { describe, test, expect, beforeEach } from "@jest/globals";
import { generateWeeklyAnalysisReport } from "../../src/logic/analysis-reporting";
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from "../../src/agents/tx-6-imp-1/prompts/action-03";
import type { Tx6Imp1AiClient } from "../../src/agents/tx-6-imp-1/orchestrator";

describe("generateWeeklyAnalysisReport", () => {
  // SCEN-109
  test("should extract and classify tasks from submitted reports with PII removal and confidence scoring", async () => {
    const mockReportData = [
      {
        reportId: "r001",
        submittedBy: "田中太郎",
        department: "開発部",
        content: "データベース接続エラーが発生。システム障害の可能性あり。",
        submittedAt: "2024-01-08T09:00:00Z",
      },
      {
        reportId: "r002",
        submittedBy: "鈴木花子",
        department: "QA部",
        content: "テスト工程の自動化を進めたい。プロセス改善が必要。",
        submittedAt: "2024-01-08T09:15:00Z",
      },
      {
        reportId: "r003",
        submittedBy: "佐藤次郎",
        department: "開発部",
        content: "チーム内のエンジニア不足で納期が危ぶまれている。リソース不足の状態。",
        submittedAt: "2024-01-08T09:30:00Z",
      },
      {
        reportId: "r004",
        submittedBy: "高橋美咲",
        department: "品質保証部",
        content: "本番環境でバグが5件発見された。品質問題が深刻化している。",
        submittedAt: "2024-01-08T09:45:00Z",
      },
      {
        reportId: "r005",
        submittedBy: "伊藤健一",
        department: "運用部",
        content: "定期メンテナンス実施予定。その他の対応が必要。",
        submittedAt: "2024-01-08T10:00:00Z",
      },
      {
        reportId: "r006",
        submittedBy: "山田由美",
        department: "開発部",
        content: "APIレスポンスが遅い。システム障害の兆候。",
        submittedAt: "2024-01-08T10:15:00Z",
      },
      {
        reportId: "r007",
        submittedBy: "渡辺太郎",
        department: "企画部",
        content: "ワークフロー改善案がある。プロセス改善に該当する。",
        submittedAt: "2024-01-08T10:30:00Z",
      },
      {
        reportId: "r008",
        submittedBy: "中村美優",
        department: "開発部",
        content: "契約社員2名が離職。リソース不足が深刻。",
        submittedAt: "2024-01-08T10:45:00Z",
      },
      {
        reportId: "r009",
        submittedBy: "小林花奈",
        department: "QA部",
        content: "テスト実行時に不具合が多発。品質問題が増加している。",
        submittedAt: "2024-01-08T11:00:00Z",
      },
      {
        reportId: "r010",
        submittedBy: "鈴木健太",
        department: "運用部",
        content: "ログシステムが満杯。ストレージ対応が急務。その他の対応。",
        submittedAt: "2024-01-08T11:15:00Z",
      },
    ];

    const fakeAiClient: Tx6Imp1AiClient = {
      async analyzeWithAction03(prompt: string): Promise<{
        tasks: Array<{
          taskId: string;
          category: string;
          content: string;
          extractedFrom: string;
          confidence: number;
        }>;
      }> {
        return {
          tasks: [
            {
              taskId: "task_001",
              category: "システム障害",
              content: "データベース接続エラーが発生",
              extractedFrom: "r001",
              confidence: 0.95,
            },
            {
              taskId: "task_002",
              category: "プロセス改善",
              content: "テスト工程の自動化を進めたい",
              extractedFrom: "r002",
              confidence: 0.88,
            },
            {
              taskId: "task_003",
              category: "リソース不足",
              content: "エンジニア不足で納期が危ぶまれている",
              extractedFrom: "r003",
              confidence: 0.92,
            },
            {
              taskId: "task_004",
              category: "品質問題",
              content: "本番環境でバグが5件発見された",
              extractedFrom: "r004",
              confidence: 0.91,
            },
            {
              taskId: "task_005",
              category: "その他",
              content: "定期メンテナンス実施予定",
              extractedFrom: "r005",
              confidence: 0.85,
            },
            {
              taskId: "task_006",
              category: "システム障害",
              content: "APIレスポンスが遅い",
              extractedFrom: "r006",
              confidence: 0.87,
            },
            {
              taskId: "task_007",
              category: "プロセス改善",
              content: "ワークフロー改善案がある",
              extractedFrom: "r007",
              confidence: 0.80,
            },
            {
              taskId: "task_008",
              category: "リソース不足",
              content: "契約社員2名が離職",
              extractedFrom: "r008",
              confidence: 0.93,
            },
          ],
        };
      },
    };

    const promptText = buildAction03Prompt({
      reports: mockReportData,
      previousDefinitions: [],
    });

    expect(promptText).toBeDefined();
    expect(typeof promptText).toBe("string");
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_03_PROMPT_VERSION).toBe("string");

    const analysisResult = await generateWeeklyAnalysisReport(
      mockReportData,
      fakeAiClient
    );

    expect(analysisResult).toBeDefined();
    expect(Array.isArray(analysisResult.tasks)).toBe(true);
    expect(analysisResult.tasks.length).toBeGreaterThanOrEqual(5);

    const validCategories = [
      "システム障害",
      "プロセス改善",
      "リソース不足",
      "品質問題",
      "その他",
    ];

    analysisResult.tasks.forEach((task) => {
      expect(task.taskId).toBeDefined();
      expect(typeof task.taskId).toBe("string");
      expect(validCategories).toContain(task.category);
      expect(task.content).toBeDefined();
      expect(typeof task.content).toBe("string");
      expect(task.extractedFrom).toBeDefined();
      expect(typeof task.extractedFrom).toBe("string");
      expect(typeof task.confidence).toBe("number");
      expect(task.confidence).toBeGreaterThanOrEqual(0.0);
      expect(task.confidence).toBeLessThanOrEqual(1.0);

      const piiPatterns = [
        /田中太郎/,
        /鈴木花子/,
        /佐藤次郎/,
        /高橋美咲/,
        /伊藤健一/,
        /山田由美/,
        /渡辺太郎/,
        /中村美優/,
        /小林花奈/,
        /鈴木健太/,
        /開発部/,
        /QA部/,
        /品質保証部/,
        /運用部/,
        /企画部/,
      ];

      piiPatterns.forEach((pattern) => {
        expect(task.content).not.toMatch(pattern);
      });
    });

    expect(analysisResult.status).toBe("success");
  });
});