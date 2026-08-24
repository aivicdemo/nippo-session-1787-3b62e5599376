import { describe, test, expect, beforeEach } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from "../../src/logic/issue-extraction-prioritization";

describe("prioritizeAndColorizeIssues", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1311: [normal] ダッシュボード色分け表示機能 - 優先度スコアが低い課題が緑で表示される
  test("should display low priority issue in green color on dashboard", () => {
    // Arrange: 優先度スコア25（低）の課題を準備
    const inputIssues: IssueSummary[] = [
      {
        issueId: "ISSUE-001",
        priorityScore: 25,
        keyword: "ドキュメント整理",
        impactLevel: "low",
      },
    ];

    // 色分け閾値の設定: 赤≥70、黄≥40、その他は緑
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: inputIssues,
      colorThresholds: colorThresholds,
      requestedBy: "manager-001",
    };

    // Act: 色分け処理を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Assert: 結果の構造検証
    expect(result).toHaveProperty("colorizedIssues");
    expect(result).toHaveProperty("colorDistribution");
    expect(result).toHaveProperty("processedAt");

    // Assert: 返却された課題が正確に1件であることを確認
    expect(result.colorizedIssues).toHaveLength(1);

    // Assert: 課題の基本情報が保持されていることを確認
    const colorizedIssue = result.colorizedIssues[0];
    expect(colorizedIssue.issueId).toBe("ISSUE-001");
    expect(colorizedIssue.keyword).toBe("ドキュメント整理");

    // Assert: 優先度スコア25は赤（≥70）にも黄（≥40）にも該当しないため、緑で表示されることを確認
    expect(colorizedIssue.highlightColor).toBe("green");

    // Assert: ハイライト対象フラグが正しく設定されていることを確認
    // スコア25は赤・黄の閾値以下なため、ハイライト対象ではない
    expect(colorizedIssue.shouldHighlight).toBe(false);

    // Assert: 色分布の集計が正しいことを確認
    // 緑色の課題が1件、赤と黄は0件であることを確認
    expect(result.colorDistribution.green).toBe(1);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.yellow).toBe(0);

    // Assert: 処理実行日時がISO 8601形式で記録されていることを確認
    expect(typeof result.processedAt).toBe("string");
    expect(result.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});