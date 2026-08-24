import { describe, test, expect } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア算出機能", () => {
  test("SCEN-901: 日報テキストがnullのとき課題抽出が失敗し例外をスローする", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation((text: string | null) => {
        if (text === null) {
          throw new Error("日報テキストが空です");
        }
        return { keywords: [], frequency: 0 };
      }),
      assessImpactScore: jest.fn().mockReturnValue(50),
      classifyIssueSeverity: jest.fn().mockReturnValue("medium"),
    };

    const input = {
      issueId: "ISSUE-001",
      issueContent: null as unknown as string,
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: "2024-01-15",
      teamId: "TEAM-A",
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/日報テキストが空です/);

    expect(
      mockTextAnalysisServiceAdapter.extractKeywords
    ).toHaveBeenCalledWith(null);
  });
});