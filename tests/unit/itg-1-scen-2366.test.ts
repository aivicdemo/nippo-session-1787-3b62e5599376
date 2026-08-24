import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("月次報告データ抽出 - 指定期間内に日報が存在しない場合", () => {
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // SCEN-2366
  test("should throw error when no daily reports exist in specified period", async () => {
    const targetYear = 2026;
    const targetMonth = 1;
    const requestedByUserId = "admin-user-001";

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const emptyReportRecords: any[] = [];

    expect(() => {
      extractMonthlyReportData(
        {
          targetYear,
          targetMonth,
          requestedByUserId,
          teamIdFilter: undefined,
        },
        emptyReportRecords,
        mockTextAnalysisServiceAdapter
      );
    }).toThrow(/日報データが見つかりません/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});