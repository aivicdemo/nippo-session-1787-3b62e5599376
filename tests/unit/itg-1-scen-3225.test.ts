import { runTx9Imp1Agent } from "../../src/agents/tx-9-imp-1/orchestrator";
import type {
  Tx9Imp1AiClient,
  Tx9AgentInput,
  Tx9AgentOutput,
} from "../../src/agents/tx-9-imp-1/orchestrator";

describe("tx-9-imp-1 agent escalation handling", () => {
  // SCEN-3225
  test("should suspend execution and handoff to human when escalation condition is triggered by management judgment requirement on countermeasure", async () => {
    // Initialize fake AI client that implements Tx9Imp1AiClient interface
    const fakeAiClient: Tx9Imp1AiClient = {
      executeAction01: jest.fn(async (prompt: string) => ({
        status: "success",
        data_summary: "10 daily reports aggregated from 2024-01-08 to 2024-01-12",
      })),

      executeAction02: jest.fn(async (prompt: string) => ({
        status: "success",
        unsubmitted_members: [],
        aggregated_report_count: 10,
      })),

      executeAction03: jest.fn(async (prompt: string) => ({
        status: "success",
        issue_frequency_per_day: 2.4,
        average_resolution_days: 3.5,
        completion_rate: 85,
      })),

      executeAction04: jest.fn(async (prompt: string) => ({
        status: "success",
        prioritized_issues: [
          {
            issue_id: "issue_001",
            title: "Database performance degradation",
            priority_score: 92,
            frequency_count: 8,
          },
          {
            issue_id: "issue_002",
            title: "API response timeout",
            priority_score: 78,
            frequency_count: 5,
          },
        ],
      })),

      executeAction05: jest.fn(async (prompt: string) => ({
        status: "success",
        recurrence_patterns_detected: 1,
        pattern_details: [
          {
            pattern_id: "pattern_001",
            issue_title: "Database performance degradation",
            recurrence_count: 8,
            last_occurrence: "2024-01-12",
          },
        ],
      })),

      executeAction06: jest.fn(async (prompt: string) => ({
        status: "escalation_required",
        escalation_type: "management_judgment_required",
        proposed_countermeasures: [
          {
            countermeasure_id: "cm_001",
            title: "Implement database index optimization and query rewrite",
            estimated_impact: "High - reduce query time by 60%",
            estimated_cost: "High - requires 2 weeks development effort",
            requires_management_decision: true,
            decision_points: [
              "Budget allocation for database infrastructure upgrade",
              "Project timeline impact assessment",
              "ROI calculation against operational costs",
            ],
          },
        ],
        escalation_reason:
          "Countermeasure implementation requires executive-level budget and timeline approval",
      })),

      executeAction07: jest.fn(async (prompt: string) => ({
        status: "pending",
        message: "Awaiting human decision before proceeding",
      })),
    };

    // Prepare mock daily report data for analysis period (2024-01-08 to 2024-01-12)
    const aggregationStartDate = "2024-01-08";
    const aggregationEndDate = "2024-01-12";
    const targetTeamIds = ["team_001"];
    const requestedByUserId = "user_manager_001";

    const agentInput: Tx9AgentInput = {
      aggregationPeriodStart: new Date(
        `${aggregationStartDate}T00:00:00Z`
      ),
      aggregationPeriodEnd: new Date(
        `${aggregationEndDate}T23:59:59Z`
      ),
      targetTeamIds: targetTeamIds,
      managerUserId: requestedByUserId,
    };

    // Execute agent
    const result = await runTx9Imp1Agent(agentInput, fakeAiClient);

    // Verify escalation condition was detected
    expect(result).toHaveProperty("reportDeliveryStatus");
    expect(result.reportDeliveryStatus).toBe("pending");

    // Verify escalation metadata is present
    expect(result).toHaveProperty("escalationContext");
    const escalationContext = result.escalationContext as {
      escalation_point: string;
      escalation_action: string;
      escalation_reason: string;
      escalation_timestamp: string;
      agent_version: string;
    };
    expect(escalationContext.escalation_point).toBe(
      "提案施策の実行に経営判断が必要"
    );
    expect(escalationContext.escalation_action).toBe("human_handoff_required");
    expect(escalationContext.escalation_reason).toContain(
      "executive-level budget and timeline approval"
    );
    expect(escalationContext.escalation_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Verify side effects are NOT confirmed before human handoff
    expect(result).toHaveProperty("agentState");
    const agentState = result.agentState as {
      status: string;
      side_effects_confirmed: Record<string, boolean>;
    };
    expect(agentState.status).toBe("suspended");
    expect(agentState.side_effects_confirmed.report_delivered).toBe(false);
    expect(agentState.side_effects_confirmed.countermeasure_execution_authorized)
      .toBe(false);
    expect(agentState.side_effects_confirmed.auto_instruction_executed).toBe(
      false
    );

    // Verify human handoff notification was prepared
    expect(result).toHaveProperty("handoffNotification");
    const handoffNotification = result.handoffNotification as {
      recipient_user_id: string;
      escalation_reason: string;
      pending_countermeasures: Array<{
        countermeasure_id: string;
        title: string;
      }>;
      decision_points: string[];
      status: string;
    };
    expect(handoffNotification.recipient_user_id).toBe(requestedByUserId);
    expect(handoffNotification.escalation_reason).toContain(
      "経営判断が必要"
    );
    expect(handoffNotification.pending_countermeasures).toHaveLength(1);
    expect(handoffNotification.pending_countermeasures[0].title).toContain(
      "database index optimization"
    );
    expect(handoffNotification.decision_points).toEqual([
      "Budget allocation for database infrastructure upgrade",
      "Project timeline impact assessment",
      "ROI calculation against operational costs",
    ]);
    expect(handoffNotification.status).toBe("awaiting_human_confirmation");

    // Verify audit event was recorded
    expect(result).toHaveProperty("auditEvents");
    const auditEvents = result.auditEvents as Array<{
      event_type: string;
      escalation_point: string;
      escalation_action: string;
      timestamp: string;
      agent_version: string;
      manager_user_id: string;
    }>;
    expect(auditEvents.length).toBeGreaterThan(0);
    const escalationAuditEvent = auditEvents.find(
      (evt) => evt.event_type === "escalation_triggered"
    );
    expect(escalationAuditEvent).toBeDefined();
    expect(escalationAuditEvent?.escalation_point).toBe(
      "提案施策の実行に経営判断が必要"
    );
    expect(escalationAuditEvent?.escalation_action).toBe(
      "human_handoff_required"
    );
    expect(escalationAuditEvent?.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(escalationAuditEvent?.agent_version).toBeDefined();
    expect(escalationAuditEvent?.manager_user_id).toBe(requestedByUserId);

    // Verify AI client actions were called in sequence (happy path until escalation)
    expect(fakeAiClient.executeAction01).toHaveBeenCalled();
    expect(fakeAiClient.executeAction02).toHaveBeenCalled();
    expect(fakeAiClient.executeAction03).toHaveBeenCalled();
    expect(fakeAiClient.executeAction04).toHaveBeenCalled();
    expect(fakeAiClient.executeAction05).toHaveBeenCalled();
    expect(fakeAiClient.executeAction06).toHaveBeenCalled();
    // Action 07 should NOT execute because escalation stops processing
    expect(fakeAiClient.executeAction07).not.toHaveBeenCalled();

    // Verify productivity metrics are calculated and available
    expect(result).toHaveProperty("productivityMetrics");
    const metrics = result.productivityMetrics as {
      issueFrequencyPerDay: number;
      averageResolutionDays: number;
      completionRate: number;
    };
    expect(metrics.issueFrequencyPerDay).toBe(2.4);
    expect(metrics.averageResolutionDays).toBe(3.5);
    expect(metrics.completionRate).toBe(85);

    // Verify prioritized issues are available
    expect(result).toHaveProperty("prioritizedIssues");
    const prioritizedIssuesList = result.prioritizedIssues as {
      issues: Array<{
        issue_id: string;
        title: string;
        priority_score: number;
      }>;
      countermeasures: Array<{
        countermeasure_id: string;
        title: string;
      }>;
    };
    expect(prioritizedIssuesList.issues).toHaveLength(2);
    expect(prioritizedIssuesList.issues[0].priority_score).toBe(92);
    expect(prioritizedIssuesList.issues[1].priority_score).toBe(78);

    // Verify no auto-delivery occurred
    expect(result.reportDeliveryStatus).not.toBe("delivered");
    expect(result.reportDeliveryStatus).toBe("pending");

    // Verify agent execution log contains rollback preparation state
    expect(result).toHaveProperty("executionLog");
    const executionLog = result.executionLog as Array<{
      action_number: number;
      status: string;
      timestamp: string;
    }>;
    expect(executionLog.length).toBeGreaterThanOrEqual(6);
    const finalLogEntry = executionLog[executionLog.length - 1];
    expect(finalLogEntry.status).toContain("escalation") || expect(
      finalLogEntry.status
    ).toBe("suspended");
  });
});