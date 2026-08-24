import { extractWeeklyReportData } from "../../src/logic/weekly-issue-analysis";

describe("日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能", () => {
  // SCEN-1448
  test("前週日報データが1件も存在しない場合にエラーが返される", () => {
    const weekStartDate = new Date("2024-01-08T00:00:00Z");
    const weekEndDate = new Date("2024-01-14T23:59:59Z");
    const teamIds = ["team-001", "team-002"];
    const requestedByUserId = "user-manager-001";

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: true,
        deliveryStatus: "delivered",
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: "sched-123",
        scheduledAt: new Date().toISOString(),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "delivered",
        timestamp: new Date().toISOString(),
      }),
    };

    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        occurrences: {},
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 0,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: "low",
      }),
    };

    const result = extractWeeklyReportData(
      {
        weekStartDate,
        weekEndDate,
        teamIds,
        requestedByUserId,
      },
      notificationServiceAdapterStub,
      textAnalysisServiceAdapterStub,
      []
    );

    expect(result).toEqual({
      success: false,
      errorCode: "NO_DAILY_REPORTS_FOUND",
      errorMessage:
        "集約対象期間内に日報データが1件も存在しません。集計を中止します",
    });

    expect(notificationServiceAdapterStub.sendReminderNotification).not.toHaveBeenCalled();
    expect(textAnalysisServiceAdapterStub.extractKeywords).not.toHaveBeenCalled();
  });
});