import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from "../../src/logic/issue-extraction-prioritization";

describe("優先度スコア色分け表示機能 - 報告提出期限と判定期限が同日の場合", () => {
  // SCEN-1359
  test("報告提出期限と課題判定期限が同日09:00:00である場合、期限時刻到達までに課題の影響度スコアが算出され、ダッシュボードの優先度スコア色分けが高優先度(赤系)に反映される", () => {
    // 固定日時：報告提出期限と課題判定期限が同日09:00:00
    const deadlineDateTime = new Date("2026-08-20T09:00:00Z");

    // テストデータ：課題キーワード『システム障害』に対してスコア75(0-100スケール)
    const issueWithHighImpactScore: IssueSummary = {
      issueId: "issue-001-critical",
      priorityScore: 75,
      keyword: "システム障害",
      impactLevel: "high",
    };

    const issueWithMediumScore: IssueSummary = {
      issueId: "issue-002-medium",
      priorityScore: 50,
      keyword: "データベース遅延",
      impactLevel: "medium",
    };

    const issueWithLowScore: IssueSummary = {
      issueId: "issue-003-low",
      priorityScore: 25,
      keyword: "ドキュメント不足",
      impactLevel: "low",
    };

    // 色分け設定：赤(75以上)、黄(40以上75未満)、緑(40未満)
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 75,
      yellowThresholdMin: 40,
    };

    // 入力データ
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [issueWithHighImpactScore, issueWithMediumScore, issueWithLowScore],
      colorThresholds: colorThresholds,
      requestedBy: "manager-001",
    };

    // 関数呼び出し
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // 期限時刻での処理検証
    const processedAtDateTime = new Date(result.processedAt);
    const isWithinDeadline = processedAtDateTime <= deadlineDateTime;

    // 検証：優先度スコア75の課題が赤色(red)に分類されている
    const highPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-001-critical"
    );
    expect(highPriorityIssue).toBeDefined();
    expect(highPriorityIssue?.highlightColor).toBe("red");

    // 検証：優先度スコア50の課題が黄色(yellow)に分類されている
    const mediumPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-002-medium"
    );
    expect(mediumPriorityIssue).toBeDefined();
    expect(mediumPriorityIssue?.highlightColor).toBe("yellow");

    // 検証：優先度スコア25の課題が緑色(green)に分類されている
    const lowPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-003-low"
    );
    expect(lowPriorityIssue).toBeDefined();
    expect(lowPriorityIssue?.highlightColor).toBe("green");

    // 検証：色分け配分が正確に計算されている
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.green).toBe(1);

    // 検証：処理時刻が期限内に完了している
    expect(isWithinDeadline).toBe(true);

    // 検証：すべての課題がハイライト対象として標記されている
    result.colorizedIssues.forEach((issue) => {
      expect(issue.shouldHighlight).toBe(true);
    });

    // 検証：処理時刻が ISO 8601 形式であること
    expect(result.processedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );

    // 検証：返却されたリストに3つの課題が含まれている
    expect(result.colorizedIssues).toHaveLength(3);
  });
});