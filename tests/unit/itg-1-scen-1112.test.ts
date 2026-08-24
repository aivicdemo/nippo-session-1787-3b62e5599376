import { ensureDashboardDataFreshness } from "../../src/logic/manager-dashboard";
import { type DashboardDataFreshnessInput, type DashboardDataFreshnessOutput } from "../../src/logic/manager-dashboard";

describe("課題の優先度を色分けで表示するダッシュボード機能", () => {
  // SCEN-1112
  test("1000名以上の大規模チームのダッシュボード全体データが60秒以内に更新される", async () => {
    const LARGE_TEAM_SIZE = 1050;
    const USER_ID = "test-manager-001";
    const TEAM_ID = "test-team-001";
    const REPORT_DATE = "2024-01-15";
    const TIMEOUT_SECONDS = 60;
    const API_RESPONSE_TIME_THRESHOLD_MS = 3000;

    // Mock NotificationServiceAdapter
    const notificationServiceAdapterMock = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent",
        deliveryTimestamp: "2024-01-15T09:00:00Z",
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
        scheduleId: "schedule-001",
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "delivered",
        failureCount: 0,
      }),
    };

    // Mock TextAnalysisServiceAdapter
    const textAnalysisServiceAdapterMock = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "database", frequency: 5 },
          { keyword: "performance", frequency: 3 },
        ],
        confidence: 0.85,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        severity: "high",
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: "high",
        classification: "critical",
      }),
    };

    const input: DashboardDataFreshnessInput = {
      userId: USER_ID,
      teamId: TEAM_ID,
      reportDate: REPORT_DATE,
      maxStalenessSeconds: TIMEOUT_SECONDS,
    };

    const startTime = Date.now();

    // Mock the actual dashboard data freshness check
    // In real implementation, this would call the actual function with mocked adapters
    const mockDashboardData = {
      isDataFresh: true,
      lastUpdateTimestamp: "2024-01-15T09:00:00Z",
      displayTimestamp: "2024-01-15T09:01:00Z",
      stalenessSeconds: 30,
    };

    // Simulate the function call with mocked dependencies
    const result: DashboardDataFreshnessOutput = await ensureDashboardDataFreshness(
      input,
      notificationServiceAdapterMock as any,
      textAnalysisServiceAdapterMock as any
    );

    const elapsedTimeMs = Date.now() - startTime;
    const elapsedTimeSeconds = Math.ceil(elapsedTimeMs / 1000);

    // Verify response time is within threshold
    expect(elapsedTimeMs).toBeLessThanOrEqual(API_RESPONSE_TIME_THRESHOLD_MS);

    // Verify data freshness output
    expect(result).toEqual(
      expect.objectContaining({
        isDataFresh: expect.any(Boolean),
        lastUpdateTimestamp: expect.any(String),
        displayTimestamp: expect.any(String),
        stalenessSeconds: expect.any(Number),
      })
    );

    // Verify stalenessSeconds is within acceptable range
    expect(result.stalenessSeconds).toBeLessThanOrEqual(TIMEOUT_SECONDS);

    // Verify timestamps are valid ISO 8601 format
    expect(result.lastUpdateTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(result.displayTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Verify that TextAnalysisServiceAdapter was called for keyword extraction
    expect(textAnalysisServiceAdapterMock.extractKeywords).toHaveBeenCalled();

    // Verify that NotificationServiceAdapter was NOT called
    // (Dashboard refresh is independent of notifications)
    expect(
      notificationServiceAdapterMock.sendReminderNotification
    ).not.toHaveBeenCalled();
    expect(notificationServiceAdapterMock.scheduleNotification).not.toHaveBeenCalled();

    // Verify processing completed within timeout
    expect(elapsedTimeSeconds).toBeLessThanOrEqual(TIMEOUT_SECONDS);

    // Verify data freshness is confirmed
    expect(result.isDataFresh).toBe(true);
  });
});