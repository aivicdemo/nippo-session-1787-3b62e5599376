import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import { type Tx4Imp1AiClient } from "../../src/agents/tx-4-imp-1/orchestrator";
import { type Tx4AgentExecutionRequest, type Tx4AgentExecutionResult } from "../../src/agents/tx-4-imp-1/orchestrator";

describe("Tx4Imp1Agent - ダッシュボード分析から課題指示までの自動実行", () => {
  // SCEN-074
  test("should extract detected issues (progress delays, non-submissions, anomalies) and pass them through subsequent actions", async () => {
    const executionTimestamp = new Date("2024-01-15T09:00:00Z");
    const targetDate = "2024-01-15";
    const executorUserId = "user-director-001";
    const teamId = "team-engineering-001";

    const request: Tx4AgentExecutionRequest = {
      executionTimestamp,
      targetDate,
      executorUserId,
      teamId,
    };

    const mockAiClient: Tx4Imp1AiClient = {
      action01_aggregateDashboardData: jest.fn().mockResolvedValue({
        projectA_actualProgress: 60,
        projectA_plannedProgress: 80,
        projectB_actualProgress: 75,
        projectB_plannedProgress: 95,
        nonSubmittedMembers: ["member-x", "member-y", "member-z"],
        kpiAchievementRate: 45,
      }),

      action02_detectIssues: jest.fn().mockResolvedValue([
        {
          issueId: "issue-progress-delay-001",
          issueType: "progress_delay",
          detectedAt: "2024-01-15T09:00:00Z",
          projectId: "project-a",
          actualProgress: 60,
          plannedProgress: 80,
          severity: "high",
        },
        {
          issueId: "issue-progress-delay-002",
          issueType: "progress_delay",
          detectedAt: "2024-01-15T09:00:00Z",
          projectId: "project-b",
          actualProgress: 75,
          plannedProgress: 95,
          severity: "medium",
        },
        {
          issueId: "issue-non-submission-001",
          issueType: "non_submission",
          detectedAt: "2024-01-15T09:00:00Z",
          memberId: "member-x",
          severity: "medium",
        },
        {
          issueId: "issue-non-submission-002",
          issueType: "non_submission",
          detectedAt: "2024-01-15T09:00:00Z",
          memberId: "member-y",
          severity: "medium",
        },
        {
          issueId: "issue-non-submission-003",
          issueType: "non_submission",
          detectedAt: "2024-01-15T09:00:00Z",
          memberId: "member-z",
          severity: "medium",
        },
        {
          issueId: "issue-kpi-anomaly-001",
          issueType: "kpi_anomaly",
          detectedAt: "2024-01-15T09:00:00Z",
          kpiName: "sales_achievement_rate",
          anomalyValue: 45,
          severity: "high",
        },
      ]),

      action03_matchPastIssues: jest
        .fn()
        .mockResolvedValue([
          {
            issueId: "issue-progress-delay-001",
            riskScore: 0.85,
            recurrenceCount: 3,
          },
          {
            issueId: "issue-progress-delay-002",
            riskScore: 0.6,
            recurrenceCount: 1,
          },
          {
            issueId: "issue-non-submission-001",
            riskScore: 0.4,
            recurrenceCount: 2,
          },
          {
            issueId: "issue-non-submission-002",
            riskScore: 0.35,
            recurrenceCount: 1,
          },
          {
            issueId: "issue-non-submission-003",
            riskScore: 0.3,
            recurrenceCount: 0,
          },
          {
            issueId: "issue-kpi-anomaly-001",
            riskScore: 0.9,
            recurrenceCount: 5,
          },
        ]),

      action04_prioritizeIssues: jest.fn().mockResolvedValue([
        {
          issueId: "issue-kpi-anomaly-001",
          priority: 1,
          priorityLabel: "critical",
          urgency: 10,
          impactScope: "enterprise",
        },
        {
          issueId: "issue-progress-delay-001",
          priority: 2,
          priorityLabel: "high",
          urgency: 9,
          impactScope: "team",
        },
        {
          issueId: "issue-progress-delay-002",
          priority: 3,
          priorityLabel: "high",
          urgency: 7,
          impactScope: "project",
        },
        {
          issueId: "issue-non-submission-001",
          priority: 4,
          priorityLabel: "medium",
          urgency: 5,
          impactScope: "individual",
        },
        {
          issueId: "issue-non-submission-002",
          priority: 5,
          priorityLabel: "medium",
          urgency: 4,
          impactScope: "individual",
        },
        {
          issueId: "issue-non-submission-003",
          priority: 6,
          priorityLabel: "low",
          urgency: 3,
          impactScope: "individual",
        },
      ]),

      action05_generateCountermeasurePlan: jest.fn().mockResolvedValue({
        planId: "plan-tx4-20240115-001",
        recommendedActions: [
          "Escalate KPI anomaly to executive team immediately",
          "Schedule emergency status meeting for project-a",
          "Send reminder notification to non-submitted members",
          "Review resource allocation for delayed projects",
        ],
        estimatedResolutionDays: 3,
        assignedOwner: "user-director-001",
      }),

      action06_generateMorningMeetingMaterial: jest.fn().mockResolvedValue({
        materialId: "material-tx4-20240115-001",
        contentSections: [
          {
            sectionTitle: "Critical Issues",
            issueCount: 1,
            issues: ["issue-kpi-anomaly-001"],
          },
          {
            sectionTitle: "High Priority Issues",
            issueCount: 2,
            issues: ["issue-progress-delay-001", "issue-progress-delay-002"],
          },
          {
            sectionTitle: "Medium Priority Issues",
            issueCount: 2,
            issues: ["issue-non-submission-001", "issue-non-submission-002"],
          },
          {
            sectionTitle: "Low Priority Issues",
            issueCount: 1,
            issues: ["issue-non-submission-003"],
          },
        ],
        generatedAt: "2024-01-15T09:00:00Z",
      }),

      action07_notifyDirector: jest.fn().mockResolvedValue({
        notificationId: "notif-tx4-20240115-001",
        directorUserId: "user-director-001",
        notificationSent: true,
        materialUrl:
          "https://reports.internal/morning-briefing/20240115-director",
        sentAt: "2024-01-15T09:05:00Z",
      }),
    };

    const result: Tx4AgentExecutionResult = await runTx4Imp1Agent(
      request,
      mockAiClient
    );

    expect(result.executionId).toBeDefined();
    expect(result.executionId).toMatch(/^exec-tx4-/);

    const extractedIssueCount = 6;
    expect(result.extractedIssueCount).toBe(extractedIssueCount);

    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBe(6);

    expect(result.prioritizedIssues[0].issueId).toBe("issue-kpi-anomaly-001");
    expect(result.prioritizedIssues[0].priority).toBe(1);
    expect(result.prioritizedIssues[0].priorityLabel).toBe("critical");

    expect(result.prioritizedIssues[1].issueId).toBe(
      "issue-progress-delay-001"
    );
    expect(result.prioritizedIssues[1].priority).toBe(2);
    expect(result.prioritizedIssues[1].priorityLabel).toBe("high");

    expect(result.prioritizedIssues[2].issueId).toBe(
      "issue-progress-delay-002"
    );
    expect(result.prioritizedIssues[2].priority).toBe(3);

    expect(result.prioritizedIssues[3].issueId).toBe(
      "issue-non-submission-001"
    );
    expect(result.prioritizedIssues[4].issueId).toBe(
      "issue-non-submission-002"
    );
    expect(result.prioritizedIssues[5].issueId).toBe(
      "issue-non-submission-003"
    );

    expect(result.countermeasurePlan).toBeDefined();
    expect(result.countermeasurePlan.planId).toBe("plan-tx4-20240115-001");
    expect(result.countermeasurePlan.recommendedActions.length).toBe(4);
    expect(result.countermeasurePlan.estimatedResolutionDays).toBe(3);
    expect(result.countermeasurePlan.assignedOwner).toBe("user-director-001");

    expect(result.summaryEmailSent).toBe(true);
    expect(result.completionTimestamp).toBeDefined();

    expect(mockAiClient.action01_aggregateDashboardData).toHaveBeenCalledWith(
      targetDate,
      teamId
    );

    expect(mockAiClient.action02_detectIssues).toHaveBeenCalled();

    expect(mockAiClient.action03_matchPastIssues).toHaveBeenCalled();
    expect(mockAiClient.action04_prioritizeIssues).toHaveBeenCalled();
    expect(mockAiClient.action05_generateCountermeasurePlan).toHaveBeenCalled();
    expect(mockAiClient.action06_generateMorningMeetingMaterial).toHaveBeenCalled();
    expect(mockAiClient.action07_notifyDirector).toHaveBeenCalled();
  });
});