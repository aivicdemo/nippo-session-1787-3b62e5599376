import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { fetchYesterdayReport } from "../../src/logic/report-submission";
import type { FetchYesterdayReportInput, DailyReport } from "../../src/logic/report-submission";

describe("fetchYesterdayReport", () => {
  // SCEN-2702
  test("should fetch previous month's report data when called on first day of month", async () => {
    const mockCurrentDate = new Date("2025-02-01T09:00:00Z");
    const mockYesterdayDate = new Date("2025-01-31T00:00:00Z");
    
    const engineerId = "U001";
    const requestingUserId = "U001";
    const targetDate = new Date("2025-01-31");
    
    const previousMonthReportData: DailyReport = {
      reportId: "REPORT-JAN-31-001",
      engineerId: engineerId,
      reportDate: mockYesterdayDate,
      yesterdayAccomplishment: "機能A実装",
      todayPlan: "テスト実施",
      challenges: "バグB対応",
      submittedAt: new Date("2025-01-31T08:30:00Z"),
    };
    
    const input: FetchYesterdayReportInput = {
      engineerId: engineerId,
      targetDate: targetDate,
      requestingUserId: requestingUserId,
    };
    
    const result = await fetchYesterdayReport(input);
    
    expect(result).toBeDefined();
    expect(result.reportId).toBe("REPORT-JAN-31-001");
    expect(result.engineerId).toBe("U001");
    expect(result.reportDate).toEqual(new Date("2025-01-31T00:00:00Z"));
    expect(result.yesterdayAccomplishment).toBe("機能A実装");
    expect(result.todayPlan).toBe("テスト実施");
    expect(result.challenges).toBe("バグB対応");
    expect(result.submittedAt).toEqual(new Date("2025-01-31T08:30:00Z"));
  });
});