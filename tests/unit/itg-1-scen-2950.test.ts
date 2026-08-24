import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-2950: [normal] 課題優先度スコア算出機能 - 課題が複数件のとき、全課題に優先度スコアが算出される
  test("複数件の課題に対して、それぞれ一意の優先度スコア（0-100の整数値）が算出される", () => {
    const testCases: IssuePriorityScoringInput[] = [
      {
        issueId: "issue-001",
        issueContent: "データベース接続タイムアウトが頻発している",
        occurrenceFrequency: 8,
        impactScore: 85,
        affectedTeamCount: 3,
        resolutionDaysAverage: 2,
        reportingDate: "2024-01-15",
        teamId: "team-dev",
      },
      {
        issueId: "issue-002",
        issueContent: "ビルド失敗が1日3回以上発生",
        occurrenceFrequency: 5,
        impactScore: 60,
        affectedTeamCount: 2,
        resolutionDaysAverage: 1,
        reportingDate: "2024-01-15",
        teamId: "team-dev",
      },
      {
        issueId: "issue-003",
        issueContent: "本番環境でメモリリークが検出された",
        occurrenceFrequency: 3,
        impactScore: 95,
        affectedTeamCount: 5,
        resolutionDaysAverage: 3,
        reportingDate: "2024-01-15",
        teamId: "team-dev",
      },
    ];

    const results: IssuePriorityScoringOutput[] = testCases.map((input) =>
      calculateIssuePriorityScore(input)
    );

    expect(results).toHaveLength(3);

    results.forEach((result) => {
      expect(result.issueId).toBeDefined();
      expect(result.priorityScore).toBeDefined();
      expect(typeof result.priorityScore).toBe("number");
      expect(result.priorityScore).toBeGreaterThanOrEqual(1);
      expect(result.priorityScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.priorityScore)).toBe(true);
    });

    const scoreValues = results.map((r) => r.priorityScore);
    const uniqueScores = new Set(scoreValues);
    expect(uniqueScores.size).toBe(3);

    const resultForIssue001 = results.find((r) => r.issueId === "issue-001");
    const resultForIssue002 = results.find((r) => r.issueId === "issue-002");
    const resultForIssue003 = results.find((r) => r.issueId === "issue-003");

    expect(resultForIssue001).toBeDefined();
    expect(resultForIssue002).toBeDefined();
    expect(resultForIssue003).toBeDefined();

    if (resultForIssue001 && resultForIssue002 && resultForIssue003) {
      expect(resultForIssue003.priorityScore).toBeGreaterThan(
        resultForIssue001.priorityScore
      );
      expect(resultForIssue001.priorityScore).toBeGreaterThan(
        resultForIssue002.priorityScore
      );

      expect(resultForIssue001.priorityRank).toBe("高");
      expect(resultForIssue002.priorityRank).toBe("中");
      expect(resultForIssue003.priorityRank).toBe("高");

      expect(resultForIssue001.colorCode).toBe("#FF0000");
      expect(resultForIssue002.colorCode).toBe("#FFFF00");
      expect(resultForIssue003.colorCode).toBe("#FF0000");

      expect(resultForIssue001.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(
        0
      );
      expect(resultForIssue001.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(
        40
      );
      expect(resultForIssue001.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(resultForIssue001.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
      expect(
        resultForIssue001.scoreBreakdown.resolutionDifficultyScore
      ).toBeGreaterThanOrEqual(0);
      expect(
        resultForIssue001.scoreBreakdown.resolutionDifficultyScore
      ).toBeLessThanOrEqual(20);

      const breakdownSum =
        resultForIssue001.scoreBreakdown.frequencyScore +
        resultForIssue001.scoreBreakdown.impactScore +
        resultForIssue001.scoreBreakdown.resolutionDifficultyScore;
      expect(breakdownSum).toBe(resultForIssue001.priorityScore);

      expect(resultForIssue001.calculatedAt).toBeDefined();
      expect(typeof resultForIssue001.calculatedAt).toBe("string");
    }
  });
});