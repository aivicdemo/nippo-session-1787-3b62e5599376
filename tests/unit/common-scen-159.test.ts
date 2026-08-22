import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  // SCEN-159: [normal] 日報集約から分析報告までの自動実行エージェント
  test("should execute complete workflow without intermediate human approval for normal dataset", async () => {
    // Prepare test data: normal dataset with no escalation conditions
    const test_period_start = new Date("2024-01-08T00:00:00Z");
    const test_period_end = new Date("2024-01-14T23:59:59Z");

    const test_submitted_reports = [
      {
        reporter_id: "ENG001",
        reporter_name: "Engineer A",
        report_date: new Date("2024-01-08T09:00:00Z"),
        achievements: [
          "Feature X development completed",
          "Code review for module Y",
        ],
        challenges: ["Integration testing delay", "Database query optimization needed"],
        planned_tasks: ["Feature Z design", "Performance tuning"],
      },
      {
        reporter_id: "ENG002",
        reporter_name: "Engineer B",
        report_date: new Date("2024-01-08T09:15:00Z"),
        achievements: ["Bug fix in component A"],
        challenges: ["External API rate limiting issue"],
        planned_tasks: ["API retry logic implementation"],
      },
      {
        reporter_id: "ENG003",
        reporter_name: "Engineer C",
        report_date: new Date("2024-01-09T09:00:00Z"),
        achievements: ["Unit test coverage increased to 85%"],
        challenges: ["Test environment setup issue"],
        planned_tasks: ["Integration test suite development"],
      },
    ];

    const test_unsubmitted_members = ["ENG004", "ENG005"];

    const test_aggregated_data = {
      total_reports: 3,
      unsubmitted_count: 2,
      collection_period: {
        start: test_period_start.toISOString(),
        end: test_period_end.toISOString(),
      },
      reports: test_submitted_reports,
    };

    const test_productivity_metrics = {
      total_issues: 5,
      resolved_issues: 3,
      average_resolution_days: 2.5,
      response_speed_score: 8.2,
      submission_rate_percent: 60,
    };

    const test_classified_issues = [
      {
        issue_id: "ISS001",
        content: "Integration testing delay",
        priority: "HIGH",
        category: "schedule_risk",
        impact_scope: "team",
      },
      {
        issue_id: "ISS002",
        content: "Database query optimization needed",
        priority: "MEDIUM",
        category: "technical_debt",
        impact_scope: "module",
      },
      {
        issue_id: "ISS003",
        content: "External API rate limiting issue",
        priority: "MEDIUM",
        category: "external_dependency",
        impact_scope: "feature",
      },
      {
        issue_id: "ISS004",
        content: "Test environment setup issue",
        priority: "LOW",
        category: "infrastructure",
        impact_scope: "team",
      },
      {
        issue_id: "ISS005",
        content: "Code review bottleneck",
        priority: "LOW",
        category: "process",
        impact_scope: "team",
      },
    ];

    const test_recurrence_patterns = [
      {
        pattern_id: "PAT001",
        base_issue: "Database performance issue",
        recurrence_count: 3,
        last_occurrence: new Date("2024-01-08T09:00:00Z").toISOString(),
        frequency_days: 7,
      },
      {
        pattern_id: "PAT002",
        base_issue: "Environment setup problem",
        recurrence_count: 2,
        last_occurrence: new Date("2024-01-09T09:00:00Z").toISOString(),
        frequency_days: 5,
      },
    ];

    const test_improvement_strategies = [
      {
        strategy_id: "STR001",
        issue_id: "ISS001",
        action: "Allocate additional testing resources",
        expected_impact: "Reduce testing delay by 40%",
        implementation_difficulty: "LOW",
        priority: "HIGH",
      },
      {
        strategy_id: "STR002",
        issue_id: "ISS002",
        action: "Implement query caching layer",
        expected_impact: "Reduce query execution time by 60%",
        implementation_difficulty: "MEDIUM",
        priority: "MEDIUM",
      },
      {
        strategy_id: "STR003",
        issue_id: "ISS003",
        action: "Implement API rate limiter with exponential backoff",
        expected_impact: "Improve API resilience by 50%",
        implementation_difficulty: "MEDIUM",
        priority: "MEDIUM",
      },
      {
        strategy_id: "STR004",
        issue_id: "ISS004",
        action: "Create automated environment setup script",
        expected_impact: "Reduce setup time by 80%",
        implementation_difficulty: "LOW",
        priority: "LOW",
      },
    ];

    const test_final_report = {
      report_id: `RPT-${new Date("2024-01-08T00:00:00Z").getTime()}`,
      period: {
        start: test_period_start.toISOString(),
        end: test_period_end.toISOString(),
      },
      aggregated_reports: test_aggregated_data,
      productivity_metrics: test_productivity_metrics,
      classified_issues: test_classified_issues,
      recurrence_patterns: test_recurrence_patterns,
      improvement_strategies: test_improvement_strategies,
      executive_summary: {
        total_issues_identified: 5,
        critical_priority_count: 1,
        submission_rate_percent: 60,
        key_recommendation:
          "Prioritize integration testing acceleration and implement database optimization to reduce critical path delays",
      },
      generated_at: expect.any(String),
    };

    // Mock AI client implementing Tx9Imp1AiClient interface
    const mock_ai_client = {
      // Action 1: Aggregate reports
      executeAction01_AggregateReports: jest
        .fn()
        .mockResolvedValue(test_aggregated_data),

      // Action 2: Identify unsubmitted members
      executeAction02_IdentifyUnsubmitted: jest
        .fn()
        .mockResolvedValue(test_unsubmitted_members),

      // Action 3: Quantify productivity metrics
      executeAction03_QuantifyMetrics: jest
        .fn()
        .mockResolvedValue(test_productivity_metrics),

      // Action 4: Classify issues by priority
      executeAction04_ClassifyIssues: jest
        .fn()
        .mockResolvedValue(test_classified_issues),

      // Action 5: Detect recurrence patterns
      executeAction05_DetectPatterns: jest
        .fn()
        .mockResolvedValue(test_recurrence_patterns),

      // Action 6: Propose improvement strategies
      executeAction06_ProposeStrategies: jest
        .fn()
        .mockResolvedValue(test_improvement_strategies),

      // Action 7: Generate final report
      executeAction07_GenerateReport: jest.fn().mockResolvedValue({
        report_id: expect.any(String),
        period: {
          start: test_period_start.toISOString(),
          end: test_period_end.toISOString(),
        },
        aggregated_reports: test_aggregated_data,
        productivity_metrics: test_productivity_metrics,
        classified_issues: test_classified_issues,
        recurrence_patterns: test_recurrence_patterns,
        improvement_strategies: test_improvement_strategies,
        executive_summary: expect.objectContaining({
          total_issues_identified: 5,
          critical_priority_count: 1,
        }),
        generated_at: expect.any(String),
      }),
    };

    // Execute sendUnsubmittedReminder function
    const reminder_execution_start = new Date("2024-01-15T08:00:00Z");
    const result = await sendUnsubmittedReminder(
      {
        period_start: test_period_start,
        period_end: test_period_end,
        department_id: "DEPT001",
        execution_time: reminder_execution_start,
      },
      mock_ai_client
    );

    // Verify all actions were executed sequentially
    expect(mock_ai_client.executeAction01_AggregateReports).toHaveBeenCalledTimes(
      1
    );
    expect(mock_ai_client.executeAction02_IdentifyUnsubmitted).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.executeAction03_QuantifyMetrics).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.executeAction04_ClassifyIssues).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.executeAction05_DetectPatterns).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.executeAction06_ProposeStrategies).toHaveBeenCalledTimes(1);
    expect(mock_ai_client.executeAction07_GenerateReport).toHaveBeenCalledTimes(1);

    // Verify result contains complete analysis data
    expect(result).toHaveProperty("aggregated_reports");
    expect(result.aggregated_reports).toEqual(test_aggregated_data);

    expect(result).toHaveProperty("productivity_metrics");
    expect(result.productivity_metrics.total_issues).toBe(5);
    expect(result.productivity_metrics.resolved_issues).toBe(3);
    expect(result.productivity_metrics.average_resolution_days).toBe(2.5);
    expect(result.productivity_metrics.response_speed_score).toBe(8.2);
    expect(result.productivity_metrics.submission_rate_percent).toBe(60);

    // Verify priority-classified issues
    expect(result).toHaveProperty("classified_issues");
    expect(result.classified_issues).toHaveLength(5);
    expect(result.classified_issues[0]).toMatchObject({
      issue_id: "ISS001",
      priority: "HIGH",
      category: "schedule_risk",
    });
    expect(result.classified_issues[1]).toMatchObject({
      issue_id: "ISS002",
      priority: "MEDIUM",
    });

    // Verify recurrence patterns
    expect(result).toHaveProperty("recurrence_patterns");
    expect(result.recurrence_patterns).toHaveLength(2);
    expect(result.recurrence_patterns[0]).toMatchObject({
      pattern_id: "PAT001",
      recurrence_count: 3,
      frequency_days: 7,
    });

    // Verify improvement strategies
    expect(result).toHaveProperty("improvement_strategies");
    expect(result.improvement_strategies).toHaveLength(4);
    expect(result.improvement_strategies[0]).toMatchObject({
      strategy_id: "STR001",
      priority: "HIGH",
      implementation_difficulty: "LOW",
    });

    // Verify executive summary
    expect(result).toHaveProperty("executive_summary");
    expect(result.executive_summary).toMatchObject({
      total_issues_identified: 5,
      critical_priority_count: 1,
      submission_rate_percent: 60,
    });

    // Verify audit events are recorded
    expect(result).toHaveProperty("audit_events");
    expect(Array.isArray(result.audit_events)).toBe(true);
    expect(result.audit_events.length).toBeGreaterThanOrEqual(7);

    // Verify action execution sequence in audit log
    const action_sequence = result.audit_events.map(
      (event: any) => event.action_id
    );
    expect(action_sequence).toContain("action_01_aggregate_reports");
    expect(action_sequence).toContain("action_02_identify_unsubmitted");
    expect(action_sequence).toContain("action_03_quantify_metrics");
    expect(action_sequence).toContain("action_04_classify_issues");
    expect(action_sequence).toContain("action_05_detect_patterns");
    expect(action_sequence).toContain("action_06_propose_strategies");
    expect(action_sequence).toContain("action_07_generate_report");

    // Verify audit events have timestamps and status
    result.audit_events.forEach((event: any) => {
      expect(event).toHaveProperty("executed_at");
      expect(event).toHaveProperty("status");
      expect(event.status).toBe("completed");
      expect(event).toHaveProperty("input_hash");
      expect(event).toHaveProperty("output_hash");
    });

    // Verify execution completed without human intervention
    expect(result).toHaveProperty("execution_status");
    expect(result.execution_status).toBe("completed_autonomous");

    // Verify total execution time is recorded
    expect(result).toHaveProperty("total_execution_time_ms");
    expect(typeof result.total_execution_time_ms).toBe("number");
    expect(result.total_execution_time_ms).toBeGreaterThan(0);

    // Verify no escalation conditions were triggered
    expect(result).toHaveProperty("escalation_triggered");
    expect(result.escalation_triggered).toBe(false);

    expect(result).toHaveProperty("escalation_details");
    expect(result.escalation_details).toEqual([]);
  });
});