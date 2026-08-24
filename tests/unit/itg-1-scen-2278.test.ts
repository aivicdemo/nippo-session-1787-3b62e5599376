import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア算出", () => {
  test("SCEN-2278: 優先度スコアが高い課題が0件の場合、優先対応課題リストは空で返される", () => {
    // Arrange: モック TextAnalysisServiceAdapter を作成
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue("low"),
    };

    // 3件以上の課題データを用意（全て影響度スコアが0になるようモック）
    const issueInputs = [
      {
        issueId: "issue-001",
        issueContent: "Database connection timeout",
        occurrenceFrequency: 5,
        impactScore: 0,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: "2024-01-15",
        teamId: "team-alpha",
      },
      {
        issueId: "issue-002",
        issueContent: "API response delay in production",
        occurrenceFrequency: 8,
        impactScore: 0,
        affectedTeamCount: 4,
        resolutionDaysAverage: 5,
        reportingDate: "2024-01-15",
        teamId: "team-beta",
      },
      {
        issueId: "issue-003",
        issueContent: "Memory leak in background service",
        occurrenceFrequency: 3,
        impactScore: 0,
        affectedTeamCount: 1,
        resolutionDaysAverage: 7,
        reportingDate: "2024-01-15",
        teamId: "team-gamma",
      },
    ];

    // Act: calculateIssuePriorityScore を実行
    // 優先度スコア閾値を50以上に設定
    const results = issueInputs.map((input) =>
      calculateIssuePriorityScore(input, mockTextAnalysisAdapter)
    );

    // Assert: 全ての課題のスコアが50未満になることを確認
    const prioritizedIssues = results.filter(
      (result) => result.priorityScore >= 50
    );

    expect(prioritizedIssues).toEqual([]);
    expect(prioritizedIssues.length).toBe(0);

    // 計算結果を個別確認：全て低スコアであることを検証
    results.forEach((result) => {
      expect(result.priorityScore).toBeLessThan(50);
      expect(result.priorityRank).toBe("低");
      expect(result.colorCode).toBe("#00FF00"); // 低優先度は緑
    });
  });
});