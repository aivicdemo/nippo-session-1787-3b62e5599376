import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import type {
  Tx4AgentExecutionRequest,
  Tx4AgentExecutionResult,
} from "../../src/agents/tx-4-imp-1/types";

describe("tx-4-imp-1 Agent Orchestrator", () => {
  // SCEN-078: [normal] ダッシュボード分析から課題指示までの自動実行 AIエージェント
  test("should execute autonomous actions in correct order and generate dashboard report with prioritized issues", async () => {
    // Setup fake AI client with action execution tracking
    const actionExecutionLog: string[] = [];
    const fakeAiClient = {
      invokeAction01GetDashboardData: jest.fn(async () => {
        actionExecutionLog.push("ACTION_01");
        return {
          progressData: [
            { systemId: "sys001", metricName: "task_completion", value: 0.75 },
            { systemId: "sys002", metricName: "delivery_delay", value: 2 },
            { systemId: "sys003", metricName: "error_rate", value: 0.05 },
          ],
          submissionStatus: [
            { memberId: "mem001", name: "Alice", submitted: true },
            { memberId: "mem002", name: "Bob", submitted: false },
            { memberId: "mem003", name: "Charlie", submitted: false },
          ],
          timestamp: new Date("2024-02-15T08:00:00Z"),
        };
      }),
      invokeAction02ExtractIssues: jest.fn(async () => {
        actionExecutionLog.push("ACTION_02");
        return {
          extractedIssues: [
            { id: "issue001", text: "Task completion below threshold" },
            { id: "issue002", text: "Delivery delayed by 2 days" },
            { id: "issue003", text: "Error rate elevated" },
          ],
        };
      }),
      invokeAction03EvaluateReccurrenceRisk: jest.fn(async () => {
        actionExecutionLog.push("ACTION_03");
        return {
          issueRiskAssessment: [
            { issueId: "issue001", riskScore: 0.8, recurrenceCount: 2 },
            { issueId: "issue002", riskScore: 0.6, recurrenceCount: 1 },
            { issueId: "issue003", riskScore: 0.4, recurrenceCount: 0 },
          ],
        };
      }),
      invokeAction04PrioritizeIssues: jest.fn(async () => {
        actionExecutionLog.push("ACTION_04");
        return {
          prioritizedIssues: [
            {
              issueId: "issue001",
              title: "Task completion below threshold",
              severity: "HIGH",
              urgency: "HIGH",
              priority: 1,
              detectedTimestamp: new Date("2024-02-15T07:30:00Z"),
            },
            {
              issueId: "issue002",
              title: "Delivery delayed by 2 days",
              severity: "MEDIUM",
              urgency: "MEDIUM",
              priority: 2,
              detectedTimestamp: new Date("2024-02-15T07:45:00Z"),
            },
            {
              issueId: "issue003",
              title: "Error rate elevated",
              severity: "LOW",
              urgency: "LOW",
              priority: 3,
              detectedTimestamp: new Date("2024-02-15T08:00:00Z"),
            },
          ],
        };
      }),
      invokeAction05GenerateCountermeasurePlan: jest.fn(async () => {
        actionExecutionLog.push("ACTION_05");
        return {
          countermeasurePlans: [
            {
              issueId: "issue001",
              recommendedActions: [
                "Increase task assignment capacity",
                "Review workflow bottlenecks",
              ],
              estimatedResolutionDays: 3,
              assignedOwner: "team_lead_001",
            },
            {
              issueId: "issue002",
              recommendedActions: ["Adjust delivery timeline", "Add resources"],
              estimatedResolutionDays: 2,
              assignedOwner: "project_manager_001",
            },
            {
              issueId: "issue003",
              recommendedActions: ["Code review enhancement", "Testing increase"],
              estimatedResolutionDays: 1,
              assignedOwner: "qa_lead_001",
            },
          ],
        };
      }),
      invokeAction06GenerateDashboardReport: jest.fn(async () => {
        actionExecutionLog.push("ACTION_06");
        return {
          dashboardReport: {
            reportDate: "2024-02-15",
            dashboardContent: {
              progressMetrics: [
                {
                  metric: "task_completion",
                  value: 0.75,
                  status: "DELAYED",
                },
                {
                  metric: "delivery_performance",
                  value: 0.5,
                  status: "DELAYED",
                },
                { metric: "error_rate", value: 0.05, status: "ELEVATED" },
              ],
              prioritizedIssuesSummary: [
                { priority: "HIGH", count: 1, category: "performance" },
                { priority: "MEDIUM", count: 1, category: "delivery" },
                { priority: "LOW", count: 1, category: "quality" },
              ],
            },
            prioritizedIssues: [
              {
                issueId: "issue001",
                title: "Task completion below threshold",
                severity: "HIGH",
                urgency: "HIGH",
                priority: 1,
                detectedTimestamp: new Date("2024-02-15T07:30:00Z"),
              },
              {
                issueId: "issue002",
                title: "Delivery delayed by 2 days",
                severity: "MEDIUM",
                urgency: "MEDIUM",
                priority: 2,
                detectedTimestamp: new Date("2024-02-15T07:45:00Z"),
              },
              {
                issueId: "issue003",
                title: "Error rate elevated",
                severity: "LOW",
                urgency: "LOW",
                priority: 3,
                detectedTimestamp: new Date("2024-02-15T08:00:00Z"),
              },
            ],
            recommendedActions: [
              {
                issueId: "issue001",
                actions: [
                  "Increase task assignment capacity",
                  "Review workflow bottlenecks",
                ],
              },
              {
                issueId: "issue002",
                actions: ["Adjust delivery timeline", "Add resources"],
              },
              {
                issueId: "issue003",
                actions: ["Code review enhancement", "Testing increase"],
              },
            ],
            unsubmittedMembers: [
              {
                memberId: "mem002",
                name: "Bob",
                lastSubmitTimestamp: new Date("2024-02-14T09:00:00Z"),
              },
              {
                memberId: "mem003",
                name: "Charlie",
                lastSubmitTimestamp: new Date("2024-02-13T10:00:00Z"),
              },
            ],
            executionTimestamp: new Date("2024-02-15T08:15:00Z"),
          },
        };
      }),
      invokeAction07NotifyUnsubmittedMembers: jest.fn(async () => {
        actionExecutionLog.push("ACTION_07");
        return {
          notificationsSent: 2,
          notificationDetails: [
            { memberId: "mem002", name: "Bob", status: "sent" },
            { memberId: "mem003", name: "Charlie", status: "sent" },
          ],
        };
      }),
    };

    // Prepare test input
    const request: Tx4AgentExecutionRequest = {
      executionTimestamp: new Date("2024-02-15T08:15:00Z"),
      targetDate: "2024-02-15",
      executorUserId: "dept_head_001",
      teamId: "team_001",
    };

    // Execute agent
    const result = await runTx4Imp1Agent(request, fakeAiClient);

    // Verify action execution order
    expect(actionExecutionLog).toEqual([
      "ACTION_01",
      "ACTION_02",
      "ACTION_03",
      "ACTION_04",
      "ACTION_05",
      "ACTION_06",
      "ACTION_07",
    ]);

    // Verify result structure and required fields
    expect(result).toBeDefined();
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe("string");
    expect(result.aggregatedReportCount).toBeGreaterThan(0);
    expect(result.extractedIssueCount).toBe(3);

    // Verify dashboard report content
    expect(result.prioritizedIssues).toHaveLength(3);
    expect(result.prioritizedIssues[0].priority).toBe(1);
    expect(result.prioritizedIssues[0].severity).toBe("HIGH");
    expect(result.prioritizedIssues[0].urgency).toBe("HIGH");
    expect(result.prioritizedIssues[0].title).toBe(
      "Task completion below threshold"
    );
    expect(result.prioritizedIssues[0].detectedTimestamp).toEqual(
      new Date("2024-02-15T07:30:00Z")
    );

    expect(result.prioritizedIssues[1].priority).toBe(2);
    expect(result.prioritizedIssues[1].severity).toBe("MEDIUM");
    expect(result.prioritizedIssues[1].urgency).toBe("MEDIUM");

    expect(result.prioritizedIssues[2].priority).toBe(3);
    expect(result.prioritizedIssues[2].severity).toBe("LOW");
    expect(result.prioritizedIssues[2].urgency).toBe("LOW");

    // Verify countermeasure plan
    expect(result.countermeasurePlan).toBeDefined();
    expect(result.countermeasurePlan.planId).toBeDefined();
    expect(result.countermeasurePlan.recommendedActions).toHaveLength(3);
    expect(result.countermeasurePlan.estimatedResolutionDays).toBeDefined();
    expect(result.countermeasurePlan.assignedOwner).toBeDefined();

    // Verify email sent flag
    expect(result.summaryEmailSent).toBe(true);

    // Verify completion timestamp is within ±5 seconds of execution
    const completionTime = result.completionTimestamp.getTime();
    const executionTime = new Date("2024-02-15T08:15:00Z").getTime();
    const timeDiff = Math.abs(completionTime - executionTime);
    expect(timeDiff).toBeLessThanOrEqual(5000);

    // Verify all action mocks were called
    expect(fakeAiClient.invokeAction01GetDashboardData).toHaveBeenCalled();
    expect(fakeAiClient.invokeAction02ExtractIssues).toHaveBeenCalled();
    expect(
      fakeAiClient.invokeAction03EvaluateReccurrenceRisk
    ).toHaveBeenCalled();
    expect(fakeAiClient.invokeAction04PrioritizeIssues).toHaveBeenCalled();
    expect(
      fakeAiClient.invokeAction05GenerateCountermeasurePlan
    ).toHaveBeenCalled();
    expect(
      fakeAiClient.invokeAction06GenerateDashboardReport
    ).toHaveBeenCalled();
    expect(
      fakeAiClient.invokeAction07NotifyUnsubmittedMembers
    ).toHaveBeenCalled();
  });
});