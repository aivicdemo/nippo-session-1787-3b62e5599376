import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア計算・色分け表示", () => {
  // SCEN-932
  test("課題が1件のとき、その課題の優先度スコアを計算して返す", () => {
    const input: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "本番環境でデータベース接続タイムアウトが発生",
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15T09:30:00Z",
      teamId: "team-dev-001",
    };

    const result: IssuePriorityScoringOutput =
      calculateIssuePriorityScore(input);

    expect(result.issueId).toBe("issue-001");
    expect(result.priorityScore).toBe(95);
    expect(result.priorityRank).toBe("高");
    expect(result.colorCode).toBe("#FF0000");
    expect(result.scoreBreakdown.frequencyScore).toBe(40);
    expect(result.scoreBreakdown.impactScore).toBe(75);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(-20);
    expect(result.calculatedAt).toBeDefined();
    expect(typeof result.calculatedAt).toBe("string");
  });
});