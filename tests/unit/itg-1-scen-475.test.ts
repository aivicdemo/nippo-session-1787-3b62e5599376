import { describe, test, expect } from "@jest/globals";
import { searchAndRetrieveReports } from "../../src/logic/report-search-and-retrieval";
import type { ReportSearchCondition } from "../../src/logic/report-search-and-retrieval";

describe("Report Search and Retrieval", () => {
  test("SCEN-475: should throw InvalidDateRangeError when startDate is after endDate", () => {
    const searchCondition: ReportSearchCondition = {
      startDate: new Date("2024-01-15T00:00:00Z"),
      endDate: new Date("2024-01-10T00:00:00Z"),
      keywordFilter: ["バグ", "デプロイ"],
      userId: "manager-001",
    };

    expect(() => searchAndRetrieveReports(searchCondition)).toThrow(
      /検索期間は終了日以前で、30日以内で指定してください。/
    );
  });
});