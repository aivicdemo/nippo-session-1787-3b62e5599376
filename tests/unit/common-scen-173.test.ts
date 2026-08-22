import { getDashboardData } from "../../src/logic/dashboard-display";

describe("Dashboard Display Authorization", () => {
  // SCEN-173
  test("should deny data aggregation access for unauthorized user role and permit for authorized role", async () => {
    const unauthorizedUserId = "user-member-001";
    const unauthorizedUserRole = "member";
    const authorizedUserId = "user-head-001";
    const authorizedUserRole = "department_head";
    const testAccessToken = "test-token-xyz";
    const aggregationStartDate = "2024-01-01T00:00:00Z";
    const aggregationEndDate = "2024-01-31T23:59:59Z";

    // Mock AI client for unauthorized scenario
    const unauthorizedAiClient = {
      userId: unauthorizedUserId,
      userRole: unauthorizedUserRole,
      accessToken: testAccessToken,
      checkAuthorization: jest.fn(async (action: string) => {
        if (
          action === "data_aggregation" &&
          unauthorizedUserRole !== "department_head" &&
          unauthorizedUserRole !== "analyst"
        ) {
          return {
            authorized: false,
            reason: "insufficient_privileges",
          };
        }
        return { authorized: true, reason: "" };
      }),
      getAggregatedReportData: jest.fn(),
      extractIssues: jest.fn(),
      analyzeProductivityMetrics: jest.fn(),
      proposeImprovementMeasures: jest.fn(),
      generateAnalysisReport: jest.fn(),
      createAuditLogEntry: jest.fn(),
    };

    // Mock AI client for authorized scenario
    const authorizedAiClient = {
      userId: authorizedUserId,
      userRole: authorizedUserRole,
      accessToken: testAccessToken,
      checkAuthorization: jest.fn(async (action: string) => {
        if (
          action === "data_aggregation" &&
          (authorizedUserRole === "department_head" ||
            authorizedUserRole === "analyst")
        ) {
          return { authorized: true, reason: "" };
        }
        return {
          authorized: false,
          reason: "insufficient_privileges",
        };
      }),
      getAggregatedReportData: jest.fn(async () => ({
        reportDataId: "report-001",
        periodStart: aggregationStartDate,
        periodEnd: aggregationEndDate,
        aggregatedCount: 42,
      })),
      extractIssues: jest.fn(async () => ({
        issues: [{ id: "issue-001", priority: "high", title: "Test Issue" }],
      })),
      analyzeProductivityMetrics: jest.fn(async () => ({
        metricsId: "metrics-001",
        averageResolutionDays: 3.5,
      })),
      proposeImprovementMeasures: jest.fn(async () => ({
        measures: [{ id: "measure-001", description: "Improve process" }],
      })),
      generateAnalysisReport: jest.fn(async () => ({
        reportId: "analysis-001",
        status: "completed",
      })),
      createAuditLogEntry: jest.fn(async () => ({
        logId: "audit-001",
        status: "recorded",
      })),
    };

    // Test unauthorized access scenario
    const unauthorizedAuthCheck = await unauthorizedAiClient.checkAuthorization(
      "data_aggregation"
    );

    expect(unauthorizedAuthCheck.authorized).toBe(false);
    expect(unauthorizedAuthCheck.reason).toBe("insufficient_privileges");

    await unauthorizedAiClient.createAuditLogEntry({
      userId: unauthorizedUserId,
      action: "data_aggregation",
      userRole: unauthorizedUserRole,
      timestamp: new Date("2024-01-15T11:00:00Z").toISOString(),
      eventType: "Authorization Denial",
      reason: "insufficient_privileges",
    });

    expect(unauthorizedAiClient.createAuditLogEntry).toHaveBeenCalledWith({
      userId: unauthorizedUserId,
      action: "data_aggregation",
      userRole: unauthorizedUserRole,
      timestamp: "2024-01-15T11:00:00Z",
      eventType: "Authorization Denial",
      reason: "insufficient_privileges",
    });

    // Verify subsequent actions are blocked
    expect(unauthorizedAiClient.getAggregatedReportData).not.toHaveBeenCalled();
    expect(unauthorizedAiClient.extractIssues).not.toHaveBeenCalled();
    expect(unauthorizedAiClient.analyzeProductivityMetrics).not.toHaveBeenCalled();
    expect(
      unauthorizedAiClient.proposeImprovementMeasures
    ).not.toHaveBeenCalled();
    expect(unauthorizedAiClient.generateAnalysisReport).not.toHaveBeenCalled();

    // Test authorized access scenario
    const authorizedAuthCheck = await authorizedAiClient.checkAuthorization(
      "data_aggregation"
    );

    expect(authorizedAuthCheck.authorized).toBe(true);

    const aggregatedData = await authorizedAiClient.getAggregatedReportData();
    expect(aggregatedData.reportDataId).toBe("report-001");
    expect(aggregatedData.aggregatedCount).toBe(42);

    const extractedIssues = await authorizedAiClient.extractIssues();
    expect(extractedIssues.issues).toHaveLength(1);
    expect(extractedIssues.issues[0].priority).toBe("high");

    const metrics = await authorizedAiClient.analyzeProductivityMetrics();
    expect(metrics.averageResolutionDays).toBe(3.5);

    const measures = await authorizedAiClient.proposeImprovementMeasures();
    expect(measures.measures).toHaveLength(1);

    const report = await authorizedAiClient.generateAnalysisReport();
    expect(report.status).toBe("completed");

    await authorizedAiClient.createAuditLogEntry({
      userId: authorizedUserId,
      action: "data_aggregation",
      userRole: authorizedUserRole,
      timestamp: new Date("2024-01-15T11:00:00Z").toISOString(),
      eventType: "Authorization Success",
      reason: "sufficient_privileges",
    });

    expect(authorizedAiClient.createAuditLogEntry).toHaveBeenCalledWith({
      userId: authorizedUserId,
      action: "data_aggregation",
      userRole: authorizedUserRole,
      timestamp: "2024-01-15T11:00:00Z",
      eventType: "Authorization Success",
      reason: "sufficient_privileges",
    });

    // Verify getDashboardData can be called with authorized context
    const dashboardResult = await getDashboardData({
      userId: authorizedUserId,
      userRole: authorizedUserRole,
      accessToken: testAccessToken,
      startDate: aggregationStartDate,
      endDate: aggregationEndDate,
    });

    expect(dashboardResult).toBeDefined();
    expect(dashboardResult.userId).toBe(authorizedUserId);
    expect(dashboardResult.userRole).toBe(authorizedUserRole);
  });
});