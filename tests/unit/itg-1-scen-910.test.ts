import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア算出機能 - チーム波及度スコア不正時の例外処理", () => {
  test("SCEN-910: チーム波及度スコアがundefinedのとき影響度判定が失敗し例外をスローする", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ keyword: "システム障害", frequency: 5 }],
      }),
      assessImpactScore: jest
        .fn()
        .mockResolvedValue(undefined),
      classifyIssueSeverity: jest.fn().mockResolvedValue("high"),
    };

    const input = {
      issueId: "issue-001",
      issueContent: "システム障害が発生しており、複数チームで作業が停止している",
      occurrenceFrequency: 5,
      impactScore: undefined,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15T09:30:00Z",
      teamId: "team-001",
    };

    expect(() => {
      calculateIssuePriorityScore(
        input,
        mockTextAnalysisServiceAdapter as any
      );
    }).toThrow(/チーム波及度スコア/);
  });
});