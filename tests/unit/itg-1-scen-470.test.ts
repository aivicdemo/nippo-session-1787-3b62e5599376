import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from "../../src/logic/issue-extraction-prioritization";

describe("優先度の高い課題を部長向けダッシュボードで強調表示する機能", () => {
  // SCEN-470: [edge] 部長向けダッシュボード表示機能 - 優先度スコアが最高値の課題に対して強調色が正確に適用される
  test("優先度スコア100（最高値）の課題に対して強調色が正確に適用される", () => {
    // 優先度スコア100の課題
    const maxScoreIssue: IssueSummary = {
      issueId: "issue-001-max-priority",
      priorityScore: 100,
      keyword: "critical-system-outage",
      impactLevel: "high",
    };

    // 優先度スコア99の課題（比較用）
    const nearMaxScoreIssue: IssueSummary = {
      issueId: "issue-002-near-max-priority",
      priorityScore: 99,
      keyword: "performance-degradation",
      impactLevel: "high",
    };

    // 優先度スコア70の課題（比較用）
    const mediumScoreIssue: IssueSummary = {
      issueId: "issue-003-medium-priority",
      priorityScore: 70,
      keyword: "minor-bug",
      impactLevel: "medium",
    };

    const issues: IssueSummary[] = [
      maxScoreIssue,
      nearMaxScoreIssue,
      mediumScoreIssue,
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 80,
      yellowThresholdMin: 60,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: "director-001",
    };

    // 関数を呼び出す
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 基本的な構造検証
    expect(result.colorizedIssues).toBeDefined();
    expect(result.colorizedIssues.length).toBe(3);
    expect(result.colorDistribution).toBeDefined();
    expect(result.processedAt).toBeDefined();

    // 優先度スコア100の課題を抽出
    const maxScoreColorizedIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-001-max-priority"
    );
    expect(maxScoreColorizedIssue).toBeDefined();
    expect(maxScoreColorizedIssue!.highlightColor).toBe("red");

    // 優先度スコア99の課題を抽出
    const nearMaxScoreColorizedIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-002-near-max-priority"
    );
    expect(nearMaxScoreColorizedIssue).toBeDefined();
    expect(nearMaxScoreColorizedIssue!.highlightColor).toBe("red");

    // 優先度スコア70の課題を抽出
    const mediumScoreColorizedIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-003-medium-priority"
    );
    expect(mediumScoreColorizedIssue).toBeDefined();
    expect(mediumScoreColorizedIssue!.highlightColor).toBe("yellow");

    // 優先度スコア100の課題がハイライト対象であることを確認
    expect(maxScoreColorizedIssue!.shouldHighlight).toBe(true);

    // 優先度スコア99の課題がハイライト対象であることを確認
    expect(nearMaxScoreColorizedIssue!.shouldHighlight).toBe(true);

    // 優先度スコア70の課題がハイライト対象であることを確認
    expect(mediumScoreColorizedIssue!.shouldHighlight).toBe(true);

    // 色分布を検証
    expect(result.colorDistribution.red).toBe(2); // スコア100とスコア99
    expect(result.colorDistribution.yellow).toBe(1); // スコア70
    expect(result.colorDistribution.green).toBe(0);

    // 処理実行日時がISO 8601形式であることを確認
    expect(result.processedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
    );
  });
});