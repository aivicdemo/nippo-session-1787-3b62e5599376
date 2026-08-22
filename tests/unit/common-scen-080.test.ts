import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";

describe("Tx4Imp1Agent - Dashboard Analysis to Issue Direction Autonomous Execution", () => {
  // SCEN-080
  test("should handoff to human when multi-department issue is detected before committing side effects", async () => {
    // Mock AI client with escalation detection
    const mockAiClient = {
      callAction01AggregateProgressData: jest.fn().mockResolvedValue({
        dashboardDataSet: [
          {
            departmentId: "sales",
            departmentName: "営業部",
            progressMetric: 0.65,
            delayedTasks: 3,
            anomalyCount: 1,
          },
          {
            departmentId: "manufacturing",
            departmentName: "製造部",
            progressMetric: 0.58,
            delayedTasks: 5,
            anomalyCount: 2,
          },
          {
            departmentId: "planning",
            departmentName: "企画部",
            progressMetric: 0.72,
            delayedTasks: 2,
            anomalyCount: 0,
          },
        ],
      }),

      callAction02ExtractIssues: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            issueId: "issue-001",
            title: "受注データ同期遅延",
            affectedDepartments: ["sales", "manufacturing"],
            severity: "HIGH",
            description:
              "営業部の受注データが製造部のシステムに反映されない",
          },
          {
            issueId: "issue-002",
            title: "企画部の資料納期未達",
            affectedDepartments: ["planning"],
            severity: "MEDIUM",
            description: "提案資料の作成が予定より3日遅延",
          },
        ],
      }),

      callAction03ClassifyIssues: jest.fn().mockResolvedValue({
        classifiedIssues: [
          {
            issueId: "issue-001",
            category: "SYSTEM_INTEGRATION",
            priority: null,
            affectedDepartmentCount: 2,
            departmentList: ["sales", "manufacturing"],
            isMultiDepartment: true,
          },
          {
            issueId: "issue-002",
            category: "SCHEDULE_DELAY",
            priority: "MEDIUM",
            affectedDepartmentCount: 1,
            departmentList: ["planning"],
            isMultiDepartment: false,
          },
        ],
      }),

      callAction04PrioritizeIssues: jest.fn().mockResolvedValue({
        escalationDetected: true,
        escalationReason: "MULTI_DEPARTMENT_ISSUE",
        prioritizedIssues: [
          {
            issueId: "issue-001",
            priority: "CRITICAL",
            affectedDepartments: ["sales", "manufacturing"],
            requiresManualReview: true,
          },
        ],
        multiDepartmentIssueCount: 1,
      }),

      callAction05GenerateCountermeasurePlan: jest.fn(),
      callAction06GenerateMeetingMaterial: jest.fn(),
      callAction07ExtractNonSubmitters: jest.fn(),
    };

    const request = {
      executionTimestamp: new Date("2024-01-15T09:00:00Z"),
      targetDate: "2024-01-15",
      executorUserId: "user-manager-001",
      teamId: "team-engineering",
    };

    const result = await runTx4Imp1Agent(request, mockAiClient as any);

    // Verify Action 1-3 were called
    expect(mockAiClient.callAction01AggregateProgressData).toHaveBeenCalledWith(
      request
    );
    expect(mockAiClient.callAction02ExtractIssues).toHaveBeenCalled();
    expect(mockAiClient.callAction03ClassifyIssues).toHaveBeenCalled();

    // Verify Action 4 was called and detected escalation
    expect(mockAiClient.callAction04PrioritizeIssues).toHaveBeenCalled();

    // Verify Actions 5, 6, 7 were NOT called (before side effect commitment)
    expect(
      mockAiClient.callAction05GenerateCountermeasurePlan
    ).not.toHaveBeenCalled();
    expect(
      mockAiClient.callAction06GenerateMeetingMaterial
    ).not.toHaveBeenCalled();
    expect(
      mockAiClient.callAction07ExtractNonSubmitters
    ).not.toHaveBeenCalled();

    // Verify result is HumanHandoff type
    expect(result).toEqual({
      type: "HumanHandoff",
      escalationReason: "MULTI_DEPARTMENT_ISSUE",
      pendingActions: ["action-05", "action-06", "action-07"],
      sideEffectStatus: "NOT_COMMITTED",
      humanHandoffRequired: true,
      executionId: expect.any(String),
      completionTimestamp: expect.any(Date),
      context: {
        multiDepartmentIssueDetected: true,
        affectedDepartments: ["sales", "manufacturing"],
        criticalIssueCount: 1,
        requiresDirectorApproval: true,
      },
    });

    // Verify specific payload content
    expect(result.escalationReason).toBe("MULTI_DEPARTMENT_ISSUE");
    expect(result.pendingActions).toContain("action-05");
    expect(result.pendingActions).toContain("action-06");
    expect(result.pendingActions).toContain("action-07");
    expect(result.sideEffectStatus).toBe("NOT_COMMITTED");
    expect(result.humanHandoffRequired).toBe(true);

    // Verify no side effects were committed
    expect(result.sideEffectStatus).not.toBe("COMMITTED");
  });
});