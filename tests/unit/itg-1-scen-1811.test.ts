import { describe, test, expect } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告管理システム - 月次レポート生成", () => {
  // SCEN-1811: [error] 月次レポート生成機能 - 日報データの期間が対象月と一致しない場合レポート生成するとエラーになる
  test("should throw validation error when report data contains dates outside target month", () => {
    // Arrange: 2025年1月の日報データ10件を準備（入力日: 2025-01-05〜2025-01-31）
    const januaryReports = Array.from({ length: 10 }, (_, i) => ({
      reportId: `JAN-${String(i + 1).padStart(3, "0")}`,
      submissionDate: new Date(`2025-01-${String((i % 27) + 5).padStart(2, "0")}T09:00:00Z`),
      teamId: `TEAM-${(i % 3) + 1}`,
      userId: `USER-${(i % 5) + 1}`,
      content: "Test report for January",
    }));

    // Arrange: 2025年2月の日報データ5件を準備（入力日: 2025-02-01〜2025-02-15）
    const februaryReports = Array.from({ length: 5 }, (_, i) => ({
      reportId: `FEB-${String(i + 1).padStart(3, "0")}`,
      submissionDate: new Date(`2025-02-${String(i + 1).padStart(2, "0")}T09:00:00Z`),
      teamId: `TEAM-${(i % 3) + 1}`,
      userId: `USER-${(i % 5) + 1}`,
      content: "Test report for February",
    }));

    // Combine all reports - mix of January and February data
    const mixedReports = [...januaryReports, ...februaryReports];

    const input = {
      targetYear: 2025,
      targetMonth: 1, // January
      requestedByUserId: "ADMIN-001",
      reportRecords: mixedReports,
    };

    // Act & Assert: 期間外のデータが検出されるため、バリデーションエラーをスロー
    expect(() => extractMonthlyReportData(input)).toThrow(/選択月.*一致しない/);
  });
});