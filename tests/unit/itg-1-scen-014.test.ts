import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import type { Tx4AgentExecutionContext } from "../../src/agents/tx-4-imp-1/orchestrator";

describe("tx-4-imp-1 orchestrator - runTx4Imp1Agent", () => {
  let mockAiClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {
      aggregateReportsByPeriod: jest.fn(),
      extractAndRankIssuesFromReports: jest.fn(),
      calculatePriorityScoreForIssue: jest.fn(),
      generateAndSendManagerConfirmationEmail: jest.fn(),
      prepareDashboardData: jest.fn(),
    };
  });

  // SCEN-014
  test("should throw when issue keyword extraction fails during morning briefing preparation", async () => {
    const executionTimestamp = new Date("2024-01-16T09:00:00Z");
    const aggregationPeriodStartDate = new Date("2024-01-15T00:00:00Z");
    const aggregationPeriodEndDate = new Date("2024-01-15T23:59:59Z");

    const executionContext: Tx4AgentExecutionContext = {
      executionTimestamp,
      targetTeamIds: ["team-001", "team-002"],
      aggregationPeriodStartDate,
      aggregationPeriodEndDate,
    };

    const mockReportData = [
      {
        reportId: "report-001",
        employeeId: "emp-001",
        employeeName: "Alice",
        teamId: "team-001",
        yesterdayWork: "Fixed login bug",
        todayPlan: "Implement user dashboard",
        issues: "Database connection timeout",
        submittedAt: new Date("2024-01-15T08:30:00Z"),
      },
      {
        reportId: "report-002",
        employeeId: "emp-002",
        employeeName: "Bob",
        teamId: "team-001",
        yesterdayWork: "Code review completed",
        todayPlan: "Deploy feature to staging",
        issues: "Test environment unstable",
        submittedAt: new Date("2024-01-15T08:45:00Z"),
      },
      {
        reportId: "report-003",
        employeeId: "emp-003",
        employeeName: "Charlie",
        teamId: "team-002",
        yesterdayWork: "API endpoint optimization",
        todayPlan: "Performance testing",
        issues: "Memory leak detected in service",
        submittedAt: new Date("2024-01-15T08:20:00Z"),
      },
    ];

    mockAiClient.aggregateReportsByPeriod.mockResolvedValue(mockReportData);

    const issueExtractionError = new Error(
      "課題の自動抽出に失敗しました。手動確認が必要です。"
    );
    issueExtractionError.name = "IssueExtractionFailureError";

    mockAiClient.extractAndRankIssuesFromReports.mockRejectedValue(
      issueExtractionError
    );

    await expect(
      runTx4Imp1Agent(executionContext, mockAiClient)
    ).rejects.toThrow(/自動抽出/);

    expect(mockAiClient.aggregateReportsByPeriod).toHaveBeenCalledWith(
      executionContext.targetTeamIds,
      executionContext.aggregationPeriodStartDate,
      executionContext.aggregationPeriodEndDate
    );

    expect(mockAiClient.extractAndRankIssuesFromReports).toHaveBeenCalledWith(
      mockReportData
    );

    expect(mockAiClient.calculatePriorityScoreForIssue).not.toHaveBeenCalled();
    expect(
      mockAiClient.generateAndSendManagerConfirmationEmail
    ).not.toHaveBeenCalled();
    expect(mockAiClient.prepareDashboardData).not.toHaveBeenCalled();
  });
});