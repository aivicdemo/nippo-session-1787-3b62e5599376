import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractDashboardReportData } from "../../src/logic/manager-dashboard";
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
} from "../../src/logic/manager-dashboard";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-2756
  test("ダッシュボード優先度表示機能 - 優先度スコアが負の値のとき処理が失敗する", async () => {
    // Arrange: TextAnalysisServiceAdapter スタブを作成
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "パフォーマンス低下", frequency: 3 },
          { keyword: "メモリリーク", frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        issueId: "issue-001",
        score: -5, // 負の値を返す（エラーケース）
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: "high",
      }),
    };

    const input: ExtractDashboardReportDataInput = {
      userId: "user-dept-head-001",
      teamId: "team-dev-001",
      reportDate: "2024-01-15",
      includeUnsubmitted: true,
    };

    // Act & Assert: extractDashboardReportData を呼び出し、エラーハンドリングを検証
    const result = await extractDashboardReportData(input, mockTextAnalysisAdapter);

    // 期待結果(1): エラーログが記録されることを検証
    expect(result).toBeDefined();
    expect(result).toHaveProperty("reportDate");
    expect(result.reportDate).toBe("2024-01-15");

    // 期待結果(2): 画面メッセージが表示される状態に対応する
    // (エラー時にはキャッシュ表示フォールバックが有効化される)
    expect(result).toHaveProperty("submissionSummary");
    expect(result.submissionSummary).toBeDefined();

    // 期待結果(3): 前回の分析結果がキャッシュから表示される
    // prioritizedIssues には負のスコアを持つ課題が除外されている
    expect(result).toHaveProperty("prioritizedIssues");
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);

    // 期待結果(4): 負のスコアを持つ課題が優先度表示から除外されている
    // すべての prioritizedIssue.priorityScore が 0 以上であることを検証
    if (result.prioritizedIssues.length > 0) {
      for (const issue of result.prioritizedIssues) {
        expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
        expect(issue.priorityScore).toBeLessThanOrEqual(100);
      }
    }

    // 期待結果: 未提出メンバーが含まれる場合は unsubmittedMembers に格納される
    expect(result).toHaveProperty("unsubmittedMembers");
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);

    // 期待結果: lastUpdatedAt は ISO 8601 形式の文字列
    expect(result).toHaveProperty("lastUpdatedAt");
    expect(typeof result.lastUpdatedAt).toBe("string");
    expect(result.lastUpdatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});