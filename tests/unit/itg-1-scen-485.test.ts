import { analyzeIssuePatternsByTimeRange } from "../../src/logic/issue-pattern-analysis";

describe("Issue Pattern Analysis - Time Range Validation", () => {
  test("SCEN-485: should throw InvalidDateRangeError when startDate is not specified", () => {
    const input = {
      startDate: null as any,
      endDate: null as any,
      periodGranularity: "daily" as const,
      teamId: null,
    };

    expect(() => analyzeIssuePatternsByTimeRange(input)).toThrow(
      /分析対象期間/
    );
  });
});