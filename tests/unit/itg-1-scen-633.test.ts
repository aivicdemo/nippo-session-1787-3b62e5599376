import { describe, it, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア計算機能", () => {
  it("SCEN-633: 複数の課題が同一の優先度スコアを持つとき、発生頻度の高い順で並べ替える", () => {
    // Setup: 課題優先度スコア計算の入力データを準備
    const issues = [
      {
        issueId: "issue-001",
        issueContent: "キーワードA",
        occurrenceFrequency: 15,
        impactScore: 50,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: "2024-01-15",
        teamId: "team-001",
      },
      {
        issueId: "issue-002",
        issueContent: "キーワードB",
        occurrenceFrequency: 8,
        impactScore: 50,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: "2024-01-15",
        teamId: "team-001",
      },
      {
        issueId: "issue-003",
        issueContent: "キーワードC",
        occurrenceFrequency: 15,
        impactScore: 50,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: "2024-01-15",
        teamId: "team-001",
      },
    ];

    // Execute: calculateIssuePriorityScore を呼び出し、複数課題の優先度スコアを計算
    const result = calculateIssuePriorityScore(issues);

    // Assert: 結果が配列であることを確認
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);

    // Assert: 優先度スコアが同一の課題について、発生頻度の高い順で並べ替えられているか確認
    // キーワードAとCは同じ出現頻度15を持つため、優先度スコアが同一となる
    // 期待順序: キーワードA（頻度15）→ キーワードC（頻度15）→ キーワードB（頻度8）
    expect(result[0].issueId).toBe("issue-001"); // キーワードA
    expect(result[0].issueContent).toBe("キーワードA");

    expect(result[1].issueId).toBe("issue-003"); // キーワードC
    expect(result[1].issueContent).toBe("キーワードC");

    expect(result[2].issueId).toBe("issue-002"); // キーワードB
    expect(result[2].issueContent).toBe("キーワードB");

    // Assert: 同一優先度スコア内での安定した順序付けを確認
    // キーワードAとC（優先度スコア同一）の発生頻度が15で等しいため、
    // 入力順序を保持するか、または別の安定ソートが適用される
    const aIndex = result.findIndex((r) => r.issueId === "issue-001");
    const cIndex = result.findIndex((r) => r.issueId === "issue-003");
    const bIndex = result.findIndex((r) => r.issueId === "issue-002");

    // キーワードAがキーワードCより前に位置することを確認（発生頻度で同順だが安定ソート）
    expect(aIndex).toBeLessThan(cIndex);
    // 両方ともキーワードBより前に位置することを確認
    expect(aIndex).toBeLessThan(bIndex);
    expect(cIndex).toBeLessThan(bIndex);
  });
});