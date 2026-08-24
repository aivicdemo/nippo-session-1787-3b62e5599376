import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList, type IssueSummary, type ColorThresholdConfig } from "../../src/logic/issue-extraction-prioritization";

describe("prioritizeAndColorizeIssues", () => {
  // SCEN-472: [edge] 部長向けダッシュボード表示機能 - 優先度スコアが中間値の課題に対して指定の中間色が適切に適用される
  test("should apply intermediate yellow color consistently for priority scores in 45-55 range", () => {
    // Arrange: 中間値スコアを持つ課題データを準備
    const intermediateScoreIssues: IssueSummary[] = [
      {
        issueId: "issue-001-45",
        priorityScore: 45,
        keyword: "performance_issue_low_mid",
        impactLevel: "medium",
      },
      {
        issueId: "issue-002-50",
        priorityScore: 50,
        keyword: "stability_concern_mid",
        impactLevel: "medium",
      },
      {
        issueId: "issue-003-55",
        priorityScore: 55,
        keyword: "deployment_delay_high_mid",
        impactLevel: "medium",
      },
    ];

    // 色分け設定: 赤の境界70以上、黄色の境界40以上
    const colorThresholdConfig: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: intermediateScoreIssues,
      colorThresholds: colorThresholdConfig,
      requestedBy: "manager-user-001",
    };

    // Act: 優先度に基づいた色分け処理を実行
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Assert: 中間値すべてが同じ黄色（yellow）に分類されていることを検証
    expect(result.colorizedIssues).toHaveLength(3);

    // スコア45の課題が黄色
    const issue45 = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-001-45"
    );
    expect(issue45).toBeDefined();
    expect(issue45?.highlightColor).toBe("yellow");

    // スコア50の課題が黄色
    const issue50 = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-002-50"
    );
    expect(issue50).toBeDefined();
    expect(issue50?.highlightColor).toBe("yellow");

    // スコア55の課題が黄色
    const issue55 = result.colorizedIssues.find(
      (issue) => issue.issueId === "issue-003-55"
    );
    expect(issue55).toBeDefined();
    expect(issue55?.highlightColor).toBe("yellow");

    // 色分布が正確に1つの黄色カウントを記録
    expect(result.colorDistribution.yellow).toBe(3);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.green).toBe(0);

    // 処理日時が記録されている
    expect(result.processedAt).toBeDefined();
    expect(typeof result.processedAt).toBe("string");

    // 全課題が yellowハイライトフラグ付きであることを確認
    result.colorizedIssues.forEach((colorizedIssue) => {
      expect(colorizedIssue.shouldHighlight).toBe(true);
      expect(colorizedIssue.highlightColor).toBe("yellow");
    });
  });
});