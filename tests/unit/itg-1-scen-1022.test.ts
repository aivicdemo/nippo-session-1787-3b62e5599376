import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from "../../src/logic/issue-extraction-prioritization";

// SCEN-1022: [normal] 優先度別色分け表示機能 - 優先度の高い課題が部長向けダッシュボードでハイライト強調表示される
describe("prioritizeAndColorizeIssues", () => {
  test("should colorize and highlight high-priority issues with red background when priority score exceeds red threshold", () => {
    // 部員Aの高優先度課題：セキュリティ脆弱性（優先度スコア 85）
    const highPriorityIssue: IssueSummary = {
      issueId: "issue-001-security-vulnerability",
      priorityScore: 85,
      keyword: "重大なセキュリティ脆弱性が検出された",
      impactLevel: "high",
    };

    // 部員Bの低優先度課題：UI色合い調整（優先度スコア 25）
    const lowPriorityIssue: IssueSummary = {
      issueId: "issue-002-ui-color-adjustment",
      priorityScore: 25,
      keyword: "軽微なUIの色合い調整が必要",
      impactLevel: "low",
    };

    const issues: IssueSummary[] = [
      highPriorityIssue,
      lowPriorityIssue,
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: "manager-001",
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 戻り値の型チェック
    expect(result).toBeDefined();
    expect(result.colorizedIssues).toBeDefined();
    expect(Array.isArray(result.colorizedIssues)).toBe(true);
    expect(result.colorDistribution).toBeDefined();
    expect(result.processedAt).toBeDefined();

    // 高優先度課題（スコア 85）が赤色に分類されることを検証
    const colorizedHighPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-001-security-vulnerability"
    );
    expect(colorizedHighPriorityIssue).toBeDefined();
    expect(colorizedHighPriorityIssue!.shouldHighlight).toBe(true);
    expect(colorizedHighPriorityIssue!.highlightColor).toBe("red");

    // 低優先度課題（スコア 25）が緑色に分類されることを検証
    const colorizedLowPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-002-ui-color-adjustment"
    );
    expect(colorizedLowPriorityIssue).toBeDefined();
    expect(colorizedLowPriorityIssue!.shouldHighlight).toBe(false);
    expect(colorizedLowPriorityIssue!.highlightColor).toBe("green");

    // 色分布の統計が正確であることを検証
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(1);

    // 処理実行日時がISO8601形式であることを検証
    expect(new Date(result.processedAt).toISOString()).toBe(result.processedAt);
  });
});