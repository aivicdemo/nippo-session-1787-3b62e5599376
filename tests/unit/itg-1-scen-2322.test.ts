import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";
import type { MonthlyReportDataset, MonthlyExtractionRequest } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告管理システム - 月次レポートデータ抽出機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2322: [error] 課題解決速度分析機能 - 集約期間の開始日が空文字列のとき処理を中止しエラーを返す
  test("集約期間の開始日が空文字列の場合、ERR_INVALID_START_DATEエラーを返す", () => {
    const invalidRequest: MonthlyExtractionRequest = {
      targetYear: 2026,
      targetMonth: 8,
      requestedByUserId: "user-12345",
      teamIdFilter: undefined,
    };

    expect(() => extractMonthlyReportData(invalidRequest)).toThrow(
      /開始日/
    );
  });
});