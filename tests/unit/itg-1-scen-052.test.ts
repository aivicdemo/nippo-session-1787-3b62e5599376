import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";

describe("Issue Extraction and Ranking", () => {
  test("SCEN-052: should throw NoReportsProvidedError when reports list is empty", () => {
    const input = {
      reports: [],
      analysisStartDate: new Date("2026-08-01"),
      analysisEndDate: new Date("2026-08-31"),
    };

    expect(() => extractAndRankIssuesFromReports(input)).toThrow(
      /集約対象の日報が存在しません/
    );
  });
});