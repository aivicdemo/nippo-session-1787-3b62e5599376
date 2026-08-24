import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコアリング", () => {
  // SCEN-1095
  test("複数の抽出課題の優先度スコアが逆順で並ぶ場合、正しく昇順に並び替えられる", () => {
    const input_issue_a: IssuePriorityScoringInput = {
      issueId: "issue-001",
      issueContent: "データベース接続タイムアウト問題",
      occurrenceFrequency: 12,
      impactScore: 85,
      affectedTeamCount: 4,
      resolutionDaysAverage: 2.5,
      reportingDate: "2024-01-15",
      teamId: "team-dev-001",
    };

    const input_issue_b: IssuePriorityScoringInput = {
      issueId: "issue-002",
      issueContent: "ログファイルディスク容量不足",
      occurrenceFrequency: 7,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.0,
      reportingDate: "2024-01-15",
      teamId: "team-dev-001",
    };

    const input_issue_c: IssuePriorityScoringInput = {
      issueId: "issue-003",
      issueContent: "UIフォント表示ズレ",
      occurrenceFrequency: 3,
      impactScore: 30,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: "2024-01-15",
      teamId: "team-dev-001",
    };

    const output_a: IssuePriorityScoringOutput = calculateIssuePriorityScore(input_issue_a);
    const output_b: IssuePriorityScoringOutput = calculateIssuePriorityScore(input_issue_b);
    const output_c: IssuePriorityScoringOutput = calculateIssuePriorityScore(input_issue_c);

    const outputs = [output_a, output_b, output_c];

    const sorted_outputs = [...outputs].sort((a, b) => a.priorityScore - b.priorityScore);

    expect(sorted_outputs[0].issueId).toBe("issue-003");
    expect(sorted_outputs[0].priorityScore).toBeLessThanOrEqual(40);

    expect(sorted_outputs[1].issueId).toBe("issue-002");
    expect(sorted_outputs[1].priorityScore).toBeGreaterThan(40);
    expect(sorted_outputs[1].priorityScore).toBeLessThanOrEqual(60);

    expect(sorted_outputs[2].issueId).toBe("issue-001");
    expect(sorted_outputs[2].priorityScore).toBeGreaterThan(60);

    expect(sorted_outputs[0].priorityScore).toBeLessThanOrEqual(sorted_outputs[1].priorityScore);
    expect(sorted_outputs[1].priorityScore).toBeLessThanOrEqual(sorted_outputs[2].priorityScore);
  });
});