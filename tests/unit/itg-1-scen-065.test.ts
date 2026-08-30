import { formatIssueListWithColorCoding } from "../../src/logic/dashboard-presentation";

describe("Dashboard Presentation - Color Coding", () => {
  test("SCEN-065: formatIssueListWithColorCoding formats issue list with color codes and highlight flags", () => {
    // Arrange: Prepare input data with 3 issues
    const inputIssues = [
      {
        issueId: "ISSUE001",
        issueContent: "ログイン機能の遅延",
        priorityScore: 85,
        impactDegree: 9,
        frequency: 8,
      },
      {
        issueId: "ISSUE002",
        issueContent: "日報送信エラーの発生",
        priorityScore: 72,
        impactDegree: 7,
        frequency: 5,
      },
      {
        issueId: "ISSUE003",
        issueContent: "確認メール遅延",
        priorityScore: 55,
        impactDegree: 4,
        frequency: 3,
      },
    ];

    const highlightThresholdScore = 70;
    const colorScheme = "standard" as const;

    // Act: Call formatIssueListWithColorCoding
    const result = formatIssueListWithColorCoding({
      issues: inputIssues,
      highlightThresholdScore,
      colorScheme,
    });

    // Assert: Verify coloredIssues array
    expect(result.coloredIssues).toHaveLength(3);

    // Issue 1: priorityScore=85 → high → red, isHighlighted=true
    expect(result.coloredIssues[0]).toEqual({
      issueId: "ISSUE001",
      issueContent: "ログイン機能の遅延",
      priorityScore: 85,
      colorCode: "#FF0000",
      priorityRank: "high",
      isHighlighted: true,
    });

    // Issue 2: priorityScore=72 → medium → yellow, isHighlighted=true
    expect(result.coloredIssues[1]).toEqual({
      issueId: "ISSUE002",
      issueContent: "日報送信エラーの発生",
      priorityScore: 72,
      colorCode: "#FFFF00",
      priorityRank: "medium",
      isHighlighted: true,
    });

    // Issue 3: priorityScore=55 → low → green, isHighlighted=false
    expect(result.coloredIssues[2]).toEqual({
      issueId: "ISSUE003",
      issueContent: "確認メール遅延",
      priorityScore: 55,
      colorCode: "#00FF00",
      priorityRank: "low",
      isHighlighted: false,
    });

    // Assert: Verify colorDistribution (1 red, 1 yellow, 1 green)
    expect(result.colorDistribution).toEqual({
      red: 1,
      yellow: 1,
      green: 1,
    });

    // Assert: Verify highlightedIssueCount (2 issues with priorityScore >= 70)
    expect(result.highlightedIssueCount).toBe(2);
  });
});