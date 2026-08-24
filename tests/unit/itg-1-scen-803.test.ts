import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度スコア算出機能", () => {
  // SCEN-803
  test("過去7日間の集計期間がゼロのとき処理が中断される", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: "issue-001",
      issueContent: "データベース接続エラー",
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 0,
      reportingDate: "2024-01-15",
      teamId: "team-alpha",
      analysisPeriodDays: 0,
    };

    expect(() =>
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/集計期間/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});