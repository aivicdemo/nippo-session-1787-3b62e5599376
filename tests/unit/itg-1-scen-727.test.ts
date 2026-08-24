import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from "../../src/logic/issue-extraction-prioritization";

describe("prioritizeAndColorizeIssues - ダッシュボード強調表示機能", () => {
  // SCEN-727: 優先度スコアが閾値直上（例：70.1）の課題をハイライト表示する
  test("優先度スコア70.1の課題に赤色ハイライトが適用される", () => {
    const issues: IssueSummary[] = [
      {
        issueId: "issue-001",
        priorityScore: 70.1,
        keyword: "重大バグ",
        impactLevel: "high",
      },
      {
        issueId: "issue-002",
        priorityScore: 70.0,
        keyword: "軽微バグ",
        impactLevel: "low",
      },
      {
        issueId: "issue-003",
        priorityScore: 69.9,
        keyword: "改善提案",
        impactLevel: "low",
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: "user-manager-001",
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 優先度スコア70.1の課題が赤色でハイライトされていることを確認
    const highlightedIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-001"
    );
    expect(highlightedIssue).toBeDefined();
    expect(highlightedIssue?.shouldHighlight).toBe(true);
    expect(highlightedIssue?.highlightColor).toBe("red");

    // 優先度スコア70.0の課題はハイライト対象外であることを確認
    const boundaryIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-002"
    );
    expect(boundaryIssue).toBeDefined();
    expect(boundaryIssue?.shouldHighlight).toBe(false);
    expect(boundaryIssue?.highlightColor).toBe("yellow");

    // 優先度スコア69.9の課題もハイライト対象外であることを確認
    const lowPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-003"
    );
    expect(lowPriorityIssue).toBeDefined();
    expect(lowPriorityIssue?.shouldHighlight).toBe(false);
    expect(lowPriorityIssue?.highlightColor).toBe("yellow");

    // 色分布が正しいことを確認
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(2);
    expect(result.colorDistribution.green).toBe(0);

    // 処理実行日時がISO 8601形式で記録されていることを確認
    expect(result.processedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});