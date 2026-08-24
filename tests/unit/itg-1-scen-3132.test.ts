import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import type { Tx4Imp1AiClient } from "../../src/agents/tx-4-imp-1/orchestrator";

describe("runTx4Imp1Agent - Dashboard Analysis to Task Instruction Autonomous Execution", () => {
  test("SCEN-3132: Agent auto-prioritizes tasks by importance and urgency with correct ranking and scoring", async () => {
    // Setup: Create mock AI client with prioritized task response
    const mockAiClient: Tx4Imp1AiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        real_time_data: {
          team_id: "team-001",
          data_collection_time: "2024-01-15T08:00:00Z",
          members: [
            {
              member_id: "member-001",
              yesterday_achievement: "Feature A completed",
              today_plan: "Code review",
              issues: "Database connection timeout",
            },
            {
              member_id: "member-002",
              yesterday_achievement: "Testing Phase B",
              today_plan: "Bug fixing",
              issues: "Memory leak in cache",
            },
            {
              member_id: "member-003",
              yesterday_achievement: "Docs update",
              today_plan: "Deploy prep",
              issues: "Missing env variable",
            },
          ],
        },
      }),
      executeAction02: jest.fn().mockResolvedValue({
        detected_issues: [
          {
            issue_id: "issue-001",
            keyword: "Database connection timeout",
            impact_scope: "backend-service",
            affected_members_count: 2,
          },
          {
            issue_id: "issue-002",
            keyword: "Memory leak in cache",
            impact_scope: "api-layer",
            affected_members_count: 1,
          },
          {
            issue_id: "issue-003",
            keyword: "Missing env variable",
            impact_scope: "deployment",
            affected_members_count: 1,
          },
        ],
      }),
      executeAction03: jest.fn().mockResolvedValue({
        risk_assessment: [
          {
            issue_id: "issue-001",
            recurrence_risk_score: 0.85,
            historical_resolution_days: 3,
          },
          {
            issue_id: "issue-002",
            recurrence_risk_score: 0.60,
            historical_resolution_days: 5,
          },
          {
            issue_id: "issue-003",
            recurrence_risk_score: 0.40,
            historical_resolution_days: 1,
          },
        ],
      }),
      executeAction04: jest.fn().mockResolvedValue({
        prioritized_tasks: [
          {
            priority_rank: 1,
            issue_id: "issue-001",
            keyword: "Database connection timeout",
            importance: "HIGH",
            urgency: "URGENT",
            priority_score: 95,
            reasoning:
              "Importance:HIGH × Urgency:URGENT due to high impact scope and 2 affected members",
          },
          {
            priority_rank: 2,
            issue_id: "issue-002",
            keyword: "Memory leak in cache",
            importance: "MEDIUM",
            urgency: "NORMAL",
            priority_score: 60,
            reasoning:
              "Importance:MEDIUM × Urgency:NORMAL with moderate recurrence risk",
          },
          {
            priority_rank: 3,
            issue_id: "issue-003",
            keyword: "Missing env variable",
            importance: "LOW",
            urgency: "LOW",
            priority_score: 30,
            reasoning:
              "Importance:LOW × Urgency:LOW with minimal impact scope",
          },
        ],
      }),
      executeAction05: jest.fn().mockResolvedValue({
        morning_meeting_prep_material: {
          report_date: "2024-01-15",
          total_members: 10,
          submitted_count: 7,
          unsubmitted_members: ["member-004", "member-005", "member-006"],
          prioritized_issues: [
            {
              priority_rank: 1,
              keyword: "Database connection timeout",
              score: 95,
              color_code: "RED",
            },
            {
              priority_rank: 2,
              keyword: "Memory leak in cache",
              score: 60,
              color_code: "YELLOW",
            },
            {
              priority_rank: 3,
              keyword: "Missing env variable",
              score: 30,
              color_code: "GREEN",
            },
          ],
        },
      }),
      executeAction06: jest.fn().mockResolvedValue({
        notification_status: {
          unsubmitted_list_sent: true,
          unsubmitted_members: ["member-004", "member-005", "member-006"],
          notification_timestamp: "2024-01-15T08:15:00Z",
        },
      }),
      executeAction07: jest.fn().mockResolvedValue({
        completion_status: {
          execution_id: "exec-tx4-20240115-001",
          all_actions_completed: true,
          completion_timestamp: "2024-01-15T08:20:00Z",
          manager_notification_sent: true,
        },
      }),
    };

    // Execute orchestrator with mock AI client
    const result = await runTx4Imp1Agent(
      {
        teamId: "team-001",
        managerId: "manager-001",
        reportDate: "2024-01-15",
        meetingStartTime: "09:00",
      },
      mockAiClient
    );

    // Verify Action 4 execution (task prioritization)
    expect(mockAiClient.executeAction04).toHaveBeenCalled();

    // Verify prioritized tasks structure and ordering
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBe(3);

    // Verify tasks sorted by priority score descending
    expect(result.prioritizedIssues[0].priority_rank).toBe(1);
    expect(result.prioritizedIssues[0].priority_score).toBe(95);
    expect(result.prioritizedIssues[0].keyword).toBe("Database connection timeout");
    expect(result.prioritizedIssues[0].importance).toBe("HIGH");
    expect(result.prioritizedIssues[0].urgency).toBe("URGENT");
    expect(result.prioritizedIssues[0].reasoning).toMatch(/HIGH.*URGENT/);

    expect(result.prioritizedIssues[1].priority_rank).toBe(2);
    expect(result.prioritizedIssues[1].priority_score).toBe(60);
    expect(result.prioritizedIssues[1].keyword).toBe("Memory leak in cache");
    expect(result.prioritizedIssues[1].importance).toBe("MEDIUM");
    expect(result.prioritizedIssues[1].urgency).toBe("NORMAL");

    expect(result.prioritizedIssues[2].priority_rank).toBe(3);
    expect(result.prioritizedIssues[2].priority_score).toBe(30);
    expect(result.prioritizedIssues[2].keyword).toBe("Missing env variable");
    expect(result.prioritizedIssues[2].importance).toBe("LOW");
    expect(result.prioritizedIssues[2].urgency).toBe("LOW");

    // Verify priority scores are in descending order (95 > 60 > 30)
    expect(result.prioritizedIssues[0].priority_score).toBeGreaterThan(
      result.prioritizedIssues[1].priority_score
    );
    expect(result.prioritizedIssues[1].priority_score).toBeGreaterThan(
      result.prioritizedIssues[2].priority_score
    );

    // Verify each task has required fields
    result.prioritizedIssues.forEach((task) => {
      expect(task).toHaveProperty("priority_rank");
      expect(task).toHaveProperty("priority_score");
      expect(task).toHaveProperty("reasoning");
      expect(typeof task.priority_rank).toBe("number");
      expect(typeof task.priority_score).toBe("number");
      expect(typeof task.reasoning).toBe("string");
      expect(task.priority_score).toBeGreaterThanOrEqual(0);
      expect(task.priority_score).toBeLessThanOrEqual(100);
    });

    // Verify countermeasure plan is generated
    expect(result.countermeasurePlan).toBeDefined();
    expect(result.countermeasurePlan.topPriorityIssue).toBe(
      "Database connection timeout"
    );

    // Verify submission status reflects unsubmitted members
    expect(result.aggregatedReportCount).toBe(7);
    expect(result.extractedIssueCount).toBe(3);

    // Verify escalation condition not triggered (all priorities are deterministic)
    expect(result.completionTimestamp).toBeDefined();
    expect(new Date(result.completionTimestamp).getTime()).toBeGreaterThan(0);

    // Verify summary email notification sent to manager
    expect(result.summaryEmailSent).toBe(true);

    // Verify execution ID is present for audit trail
    expect(result.executionId).toBeDefined();
    expect(result.executionId).toMatch(/^exec-/);
  });
});