import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";

describe("Issue Extraction and Ranking", () => {
  test("SCEN-227: should throw NoReportsProvidedError when reports array is empty", () => {
    const reports: any[] = [];
    const analysisStartDate = new Date("2024-12-16T00:00:00Z");
    const analysisEndDate = new Date("2025-01-15T23:59:59Z");
    const teamIds = undefined;
    const minimumConfidenceThreshold = 50;

    expect(() =>
      extractAndRankIssuesFromReports(
        reports,
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumConfidenceThreshold
      )
    ).toThrow(/集約対象の日報が存在しません/);
  });
});