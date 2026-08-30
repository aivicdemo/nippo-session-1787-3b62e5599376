import { runTx9Imp1Agent } from "../../src/agents/tx-9-imp-1/orchestrator";
import { type Tx9AggregationInstruction, type Tx9AnalysisReportResult } from "../../src/agents/tx-9-imp-1/orchestrator";

describe("tx-9-imp-1 orchestrator", () => {
  test("SCEN-026: runTx9Imp1Agent processes monthly aggregation instruction and returns analysis report with productivity metrics, prioritized issues, and improvement suggestions", async () => {
    const aggregationInstruction: Tx9AggregationInstruction = {
      aggregationStartDate: "2024-01-01",
      aggregationEndDate: "2024-01-31",
      targetUserIds: ["user1", "user2", "user3"],
      targetTeamIds: [],
      outputFormat: "summary",
      managerId: "manager1",
    };

    const mockAggregatedReports = [
      {
        employeeId: "user1",
        reportDate: "2024-01-05",
        yesterdayWork: "completed feature X",
        todayPlan: "implement feature Y",
        issues: "bug in module A",
      },
      {
        employeeId: "user2",
        reportDate: "2024-01-05",
        yesterdayWork: "testing module B",
        todayPlan: "deploy to staging",
        issues: "performance issue in API endpoint",
      },
      {
        employeeId: "user3",
        reportDate: "2024-01-05",
        yesterdayWork: "code review",
        todayPlan: "database optimization",
        issues: "connection pool exhaustion",
      },
      {
        employeeId: "user1",
        reportDate: "2024-01-10",
        yesterdayWork: "feature Y progress",
        todayPlan: "unit testing",
        issues: "bug in module A still occurring",
      },
      {
        employeeId: "user2",
        reportDate: "2024-01-10",
        yesterdayWork: "staging deployment",
        todayPlan: "production release",
        issues: "performance issue in API endpoint recurrence",
      },
      {
        employeeId: "user3",
        reportDate: "2024-01-10",
        yesterdayWork: "database optimization",
        todayPlan: "monitoring setup",
        issues: "connection pool exhaustion ongoing",
      },
      {
        employeeId: "user1",
        reportDate: "2024-01-15",
        yesterdayWork: "unit testing completed",
        todayPlan: "integration testing",
        issues: "memory leak detected in module C",
      },
      {
        employeeId: "user2",
        reportDate: "2024-01-15",
        yesterdayWork: "production release done",
        todayPlan: "post-release monitoring",
        issues: "performance issue resolved",
      },
      {
        employeeId: "user3",
        reportDate: "2024-01-15",
        yesterdayWork: "monitoring setup complete",
        todayPlan: "alert tuning",
        issues: "connection pool exhaustion resolved",
      },
      {
        employeeId: "user1",
        reportDate: "2024-01-20",
        yesterdayWork: "integration testing",
        todayPlan: "bug fixing",
        issues: "memory leak still present",
      },
      {
        employeeId: "user2",
        reportDate: "2024-01-20",
        yesterdayWork: "post-release monitoring",
        todayPlan: "incident response",
        issues: "unexpected spike in API calls",
      },
      {
        employeeId: "user3",
        reportDate: "2024-01-20",
        yesterdayWork: "alert tuning",
        todayPlan: "dashboard update",
        issues: "insufficient documentation",
      },
    ];

    const mockProductivityMetrics = {
      issueResolutionSpeed: 2.5,
      reportSubmissionRate: 100,
      issueRecurrenceRate: 33.33,
      teamProductivityScore: 78,
    };

    const mockPrioritizedIssues = [
      {
        issueId: "issue_001",
        issueContent: "bug in module A",
        priorityScore: 85,
        priorityRank: "high" as const,
        colorCode: "red" as const,
        occurrenceFrequency: 2,
        impactDegree: 67,
      },
      {
        issueId: "issue_002",
        issueContent: "performance issue in API endpoint",
        priorityScore: 65,
        priorityRank: "medium" as const,
        colorCode: "yellow" as const,
        occurrenceFrequency: 2,
        impactDegree: 50,
      },
      {
        issueId: "issue_003",
        issueContent: "memory leak detected in module C",
        priorityScore: 58,
        priorityRank: "medium" as const,
        colorCode: "yellow" as const,
        occurrenceFrequency: 2,
        impactDegree: 42,
      },
    ];

    const mockImprovementSuggestions = [
      {
        suggestionId: "sugg_001",
        relatedIssueIds: ["issue_001"],
        suggestedAction:
          "Implement comprehensive code review for module A with focus on error handling",
        expectedImpact:
          "Reduce bug recurrence rate by 50% within 2 weeks",
        implementationPriority: "immediate" as const,
      },
      {
        suggestionId: "sugg_002",
        relatedIssueIds: ["issue_002"],
        suggestedAction:
          "Optimize API endpoint queries and implement caching strategy",
        expectedImpact:
          "Improve API response time by 40% and reduce load spike incidents",
        implementationPriority: "short_term" as const,
      },
    ];

    const mockAiClient = {
      aggregateReportsByPeriod: jest
        .fn()
        .mockResolvedValue(mockAggregatedReports),
      calculateProductivityMetrics: jest
        .fn()
        .mockResolvedValue(mockProductivityMetrics),
      extractAndRankIssuesFromReports: jest
        .fn()
        .mockResolvedValue(mockPrioritizedIssues),
      validateReportQuality: jest.fn().mockResolvedValue({
        qualityValidationStatus: "approved" as const,
        completenessPercentage: 92,
      }),
      saveExtractedIssueData: jest.fn().mockResolvedValue(undefined),
      generateAndSendManagerConfirmationEmail: jest.fn().mockResolvedValue({
        managerNotificationSent: true,
      }),
    };

    const result: Tx9AnalysisReportResult = await runTx9Imp1Agent(
      aggregationInstruction,
      mockAiClient as any
    );

    expect(result).toBeDefined();
    expect(result.reportId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(result.aggregationPeriod.startDate).toBe("2024-01-01");
    expect(result.aggregationPeriod.endDate).toBe("2024-01-31");

    expect(result.productivityMetrics).toBeDefined();
    expect(result.productivityMetrics.issueResolutionSpeed).toBe(2.5);
    expect(result.productivityMetrics.reportSubmissionRate).toBe(100);
    expect(result.productivityMetrics.issueRecurrenceRate).toBe(33.33);
    expect(result.productivityMetrics.teamProductivityScore).toBe(78);

    expect(result.prioritizedIssues).toHaveLength(3);
    expect(result.prioritizedIssues[0].priorityRank).toBe("high");
    expect(result.prioritizedIssues[0].priorityScore).toBe(85);
    expect(result.prioritizedIssues[1].priorityRank).toBe("medium");
    expect(result.prioritizedIssues[1].priorityScore).toBe(65);
    expect(result.prioritizedIssues[2].priorityRank).toBe("medium");
    expect(result.prioritizedIssues[2].priorityScore).toBe(58);

    expect(result.improvementSuggestions).toHaveLength(2);
    expect(result.improvementSuggestions[0].implementationPriority).toBe(
      "immediate"
    );
    expect(result.improvementSuggestions[0].relatedIssueIds).toContain(
      "issue_001"
    );
    expect(result.improvementSuggestions[1].implementationPriority).toBe(
      "short_term"
    );

    expect(result.reportGeneratedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
    );
    expect(result.qualityValidationStatus).toBe("approved");
    expect(result.managerNotificationSent).toBe(true);

    expect(mockAiClient.aggregateReportsByPeriod).toHaveBeenCalledWith(
      "2024-01-01",
      "2024-01-31",
      ["user1", "user2", "user3"],
      []
    );
    expect(mockAiClient.calculateProductivityMetrics).toHaveBeenCalledWith(
      mockAggregatedReports
    );
    expect(mockAiClient.extractAndRankIssuesFromReports).toHaveBeenCalledWith(
      mockAggregatedReports
    );
    expect(mockAiClient.validateReportQuality).toHaveBeenCalledWith(
      mockAggregatedReports
    );
    expect(mockAiClient.saveExtractedIssueData).toHaveBeenCalledWith(
      expect.any(String),
      mockPrioritizedIssues
    );
    expect(
      mockAiClient.generateAndSendManagerConfirmationEmail
    ).toHaveBeenCalledWith(
      "manager1",
      expect.any(Object),
      expect.any(Array),
      expect.any(Array)
    );
  });
});