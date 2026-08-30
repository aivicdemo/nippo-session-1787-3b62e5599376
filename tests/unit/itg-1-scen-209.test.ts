import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";
import { type ExtractAndRankIssuesInput } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題抽出・優先度ランク付け", () => {
  test("SCEN-209: 提出された日報が0件のときNoReportsProvidedErrorを発生させる", () => {
    const analysisStartDate = new Date("2024-12-16T00:00:00Z");
    const analysisEndDate = new Date("2025-01-14T23:59:59Z");

    const input: ExtractAndRankIssuesInput = {
      reports: [],
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
    };

    expect(() => extractAndRankIssuesFromReports(input)).toThrow(/集約対象の日報が存在しません/);
  });
});