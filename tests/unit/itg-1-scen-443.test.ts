import { generateMonthlyAnalysisReport } from "../../src/logic/monthly-analysis-report";

describe("generateMonthlyAnalysisReport", () => {
  // SCEN-443: [error] 対象月が現在月より後の未来日の場合、バリデーションエラーを発生させる
  test("should throw validation error when targetMonth is after current month", () => {
    const currentDate = new Date("2024-01-15T10:00:00Z");
    const targetMonth = "2024-02";
    const projectManagerId = "pm-001";

    // Mock system time to January 2024
    jest.useFakeTimers();
    jest.setSystemTime(currentDate);

    try {
      expect(() => {
        generateMonthlyAnalysisReport({
          targetMonth: targetMonth,
          projectManagerId: projectManagerId,
        });
      }).toThrow(/対象月は現在月以前を指定してください/);
    } finally {
      jest.useRealTimers();
    }
  });
});