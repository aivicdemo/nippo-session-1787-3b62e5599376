import { describe, test, expect } from "@jest/globals";
import { fetchYesterdayReport } from "../../src/logic/report-submission";
import type { FetchYesterdayReportInput, DailyReport } from "../../src/logic/report-submission";

describe("fetchYesterdayReport", () => {
  // SCEN-2674: [normal] 前日報告内容の取得・表示機能 - ログイン済みエンジニアの前日報告が0件の場合、空の報告結果が返される
  test("should return empty report list when no previous day report exists for engineer", async () => {
    const engineerId = "eng_001";
    const requestingUserId = "eng_001";
    const targetDate = new Date("2024-01-14");

    const input: FetchYesterdayReportInput = {
      engineerId,
      targetDate,
      requestingUserId,
    };

    const result = await fetchYesterdayReport(input);

    expect(result).toEqual({
      reports: [],
      count: 0,
      message: "前日の報告はありません",
    });
    expect(Array.isArray(result.reports)).toBe(true);
    expect(result.count).toBe(0);
    expect(result.message).toBe("前日の報告はありません");
  });
});