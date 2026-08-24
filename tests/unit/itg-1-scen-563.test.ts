import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコアリング", () => {
  // SCEN-563: [normal] 課題優先度判定機能 - 影響度スコア（0～100）の範囲内で、複数の課題が異なるスコア値を持つ場合、スコア順に正確にランク付けされる
  test("複数課題が異なるスコア値を持つ場合、スコア降順で正確にランク付けされる", () => {
    const issueInputs: IssuePriorityScoringInput[] = [
      {
        issueId: "issue-a",
        issueContent: "データベース接続タイムアウト",
        occurrenceFrequency: 2,
        impactScore: 15,
        affectedTeamCount: 1,
        resolutionDaysAverage: 1,
        reportingDate: "2024-01-15",
        teamId: "team-001",
      },
      {
        issueId: "issue-b",
        issueContent: "API応答時間が遅い",
        occurrenceFrequency: 5,
        impactScore: 42,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2,
        reportingDate: "2024-01-15",
        teamId: "team-001",
      },
      {
        issueId: "issue-c",
        issueContent: "メモリリーク検出",
        occurrenceFrequency: 8,
        impactScore: 73,
        affectedTeamCount: 3,
        resolutionDaysAverage: 3,
        reportingDate: "2024-01-15",
        teamId: "team-001",
      },
      {
        issueId: "issue-d",
        issueContent: "本番システム障害",
        occurrenceFrequency: 10,
        impactScore: 88,
        affectedTeamCount: 4,
        resolutionDaysAverage: 4,
        reportingDate: "2024-01-15",
        teamId: "team-001",
      },
      {
        issueId: "issue-e",
        issueContent: "ログ出力エラー",
        occurrenceFrequency: 4,
        impactScore: 31,
        affectedTeamCount: 1,
        resolutionDaysAverage: 1,
        reportingDate: "2024-01-15",
        teamId: "team-001",
      },
    ];

    const results: IssuePriorityScoringOutput[] = issueInputs.map((input) =>
      calculateIssuePriorityScore(input)
    );

    expect(results).toHaveLength(5);

    const rankedResults = results.sort(
      (a, b) => b.priorityScore - a.priorityScore
    );

    expect(rankedResults[0].issueId).toBe("issue-d");
    expect(rankedResults[0].priorityScore).toBe(88);
    expect(rankedResults[0].priorityRank).toBe("高");
    expect(rankedResults[0].colorCode).toBe("#FF0000");

    expect(rankedResults[1].issueId).toBe("issue-c");
    expect(rankedResults[1].priorityScore).toBe(73);
    expect(rankedResults[1].priorityRank).toBe("高");
    expect(rankedResults[1].colorCode).toBe("#FF0000");

    expect(rankedResults[2].issueId).toBe("issue-b");
    expect(rankedResults[2].priorityScore).toBe(42);
    expect(rankedResults[2].priorityRank).toBe("中");
    expect(rankedResults[2].colorCode).toBe("#FFFF00");

    expect(rankedResults[3].issueId).toBe("issue-e");
    expect(rankedResults[3].priorityScore).toBe(31);
    expect(rankedResults[3].priorityRank).toBe("低");
    expect(rankedResults[3].colorCode).toBe("#00FF00");

    expect(rankedResults[4].issueId).toBe("issue-a");
    expect(rankedResults[4].priorityScore).toBe(15);
    expect(rankedResults[4].priorityRank).toBe("低");
    expect(rankedResults[4].colorCode).toBe("#00FF00");

    rankedResults.forEach((result) => {
      expect(result.priorityScore).toBeGreaterThanOrEqual(0);
      expect(result.priorityScore).toBeLessThanOrEqual(100);
      expect(result.scoreBreakdown).toBeDefined();
      expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(
        0
      );
      expect(
        result.scoreBreakdown.resolutionDifficultyScore
      ).toBeLessThanOrEqual(20);
    });

    const issueIds = rankedResults.map((r) => r.issueId);
    const uniqueIssueIds = new Set(issueIds);
    expect(uniqueIssueIds.size).toBe(5);

    const scores = rankedResults.map((r) => r.priorityScore);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }
  });
});